import base64
import json
import traceback
from fastapi import FastAPI, HTTPException, Response
from dotenv import load_dotenv
import logging
from pydantic import BaseModel, ValidationError
from typing import Optional
import psycopg2
import os
import numpy as np
import ast

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is required")

app = FastAPI()

class RatingEvent(BaseModel):
    user_id: int
    recipe_id: int
    rating: float

class PubSubMessage(BaseModel):
    data: str
    attributes: Optional[dict] = None

class PubSubPushRequest(BaseModel):
    message: PubSubMessage
    subscription: str

@app.post("/pubsub/push")
async def pubsub_push(body: PubSubPushRequest):
    rating_event = None
    try:
        data_str = base64.b64decode(body.message.data).decode("utf-8")
        rating_event = RatingEvent.model_validate_json(data_str)

    except (ValidationError, json.JSONDecodeError) as e:
        logger.warning(f"Bad message format, discarding: {e}")
        return Response(status_code=204) 

    try:
        with psycopg2.connect(DATABASE_URL) as conn:
            with conn.cursor() as cur:
                # Check if vectors exist
                cur.execute("""
                    SELECT EXISTS(SELECT 1 FROM user_vectors WHERE user_id = %s)
                    AND EXISTS(SELECT 1 FROM recipe_vectors WHERE recipe_id = %s)
                """, (rating_event.user_id, rating_event.recipe_id))
                
                vectors_exist = cur.fetchone()[0]
                if not vectors_exist:
                    logger.warning(f"Missing vectors for user {rating_event.user_id} or recipe {rating_event.recipe_id}")
                    return Response(status_code=204)
                
                # Get current vectors and metadata
                cur.execute("""
                    SELECT 
                        uv.vector, uv.bias,
                        rv.vector, rv.bias,
                        sm.global_mean
                    FROM user_vectors uv
                    CROSS JOIN recipe_vectors rv
                    CROSS JOIN (
                        SELECT global_mean 
                        FROM svd_metadata 
                        ORDER BY completion_time DESC 
                        LIMIT 1
                    ) sm
                    WHERE uv.user_id = %s AND rv.recipe_id = %s
                """, (rating_event.user_id, rating_event.recipe_id))
                
                result = cur.fetchone()
                if not result:
                    logger.warning(f"Could not fetch vectors for user {rating_event.user_id} or recipe {rating_event.recipe_id}")
                    return Response(status_code=204)
                
                user_vector, user_bias, recipe_vector, recipe_bias, global_mean = result
                
                # Parse vector strings to lists, then convert to NumPy arrays for fast computation
                user_vec = np.array(ast.literal_eval(user_vector))
                recipe_vec = np.array(ast.literal_eval(recipe_vector))
                
                # Calculate dot product (much faster in NumPy)
                dot_product = np.dot(user_vec, recipe_vec)
                
                # Calculate prediction and error
                prediction = global_mean + user_bias + recipe_bias + dot_product
                error = rating_event.rating - prediction
                
                # SGD parameters
                learning_rate = 0.01
                regularization = 0.02
                
                # Calculate new vectors using efficient NumPy operations
                # uu,new = uu + λ * (e * vi - β * uu)
                new_user_vector = user_vec + learning_rate * (error * recipe_vec - regularization * user_vec)
                
                # vi,new = vi + λ * (e * uu - β * vi)
                new_recipe_vector = recipe_vec + learning_rate * (error * user_vec - regularization * recipe_vec)
                
                # Convert back to list for PostgreSQL
                new_user_vector = new_user_vector.tolist()
                new_recipe_vector = new_recipe_vector.tolist()
                
                # Calculate new biases
                new_user_bias = user_bias + learning_rate * (error - regularization * user_bias)
                new_recipe_bias = recipe_bias + learning_rate * (error - regularization * recipe_bias)
                
                # Update user vector
                cur.execute("""
                    UPDATE user_vectors 
                    SET vector = %s, bias = %s, updated_at = NOW()
                    WHERE user_id = %s
                """, (new_user_vector, new_user_bias, rating_event.user_id))
                
                # Update recipe vector
                cur.execute("""
                    UPDATE recipe_vectors 
                    SET vector = %s, bias = %s, updated_at = NOW()
                    WHERE recipe_id = %s
                """, (new_recipe_vector, new_recipe_bias, rating_event.recipe_id))
                
                conn.commit()

        logger.info(f"Successfully processed rating for user {rating_event.user_id}")
        return Response(status_code=204)

    except Exception as e:
        error_detail = str(e)
        error_traceback = traceback.format_exc()
        logger.error(f"Error processing message: {error_detail}")
        logger.error(f"Traceback: {error_traceback}")
        raise HTTPException(status_code=500, detail=f"Error processing message: {error_detail}")


@app.get("/health")
def health():
    return {"status": "ok"}