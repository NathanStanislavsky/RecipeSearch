import base64
import json
from fastapi import FastAPI, HTTPException
from dotenv import load_dotenv
import logging
from pydantic import BaseModel, ValidationError
import psycopg2
import os

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
    attributes: dict | None = None
class PubSubPushRequest(BaseModel):
    message: PubSubMessage
    subscription: str

SGD_UPDATE_QUERY = """
WITH constants AS (
  -- Define ML parameters and received data
  SELECT
    %(learning_rate)s AS lambda,
    %(regularization)s AS beta,
    %(rating)s AS r_ui,
    %(user_id)s AS user_id,
    %(recipe_id)s AS recipe_id
),
vectors AS (
  -- Get the current vectors, biases, and global mean
  SELECT
    uv.vector AS user_vector,
    uv.bias AS user_bias,
    rv.vector AS recipe_vector,
    rv.bias AS recipe_bias,
    (SELECT global_mean FROM svd_metadata ORDER BY completion_time DESC LIMIT 1) AS global_mean
  FROM user_vectors uv
  JOIN recipe_vectors rv ON rv.recipe_id = (SELECT recipe_id FROM constants)
  WHERE uv.user_id = (SELECT user_id FROM constants)
),
prediction AS (
  -- Calculate predicted rating (p_ui) and error (e)
  SELECT
    *,
    -- p_ui = global_mean + user_bias + recipe_bias + dot(user_vector, recipe_vector)
    -- pgvector's <#> operator is NEGATIVE inner product, so we subtract it.
    (v.global_mean + v.user_bias + v.recipe_bias - (v.user_vector <#> v.recipe_vector)) AS p_ui,
    
    -- e = r_ui - p_ui
    ((SELECT r_ui FROM constants) - (v.global_mean + v.user_bias + v.recipe_bias - (v.user_vector <#> v.recipe_vector))) AS error
  FROM vectors v, constants c
),
new_values AS (
  -- Calculate the new user and recipe vectors and biases using the SGD update rules
  SELECT
    p.error,
    p.user_vector,
    p.recipe_vector,
    
    -- uu,new = uu + λ * (e * vi - β * uu)
    p.user_vector + (c.lambda * ( (p.error * p.recipe_vector) - (c.beta * p.user_vector) )) AS new_user_vector,
    
    -- bu,new = bu + λ * (e - β * bu)
    p.user_bias + (c.lambda * (p.error - (c.beta * p.user_bias))) AS new_user_bias,
    
    -- vi,new = vi + λ * (e * uu - β * vi)
    p.recipe_vector + (c.lambda * ( (p.error * p.user_vector) - (c.beta * p.recipe_vector) )) AS new_recipe_vector,
    
    -- bi,new = bi + λ * (e - β * bi)
    p.recipe_bias + (c.lambda * (p.error - (c.beta * p.recipe_bias))) AS new_recipe_bias
    
  FROM prediction p, constants c
),
user_update AS (
  -- Update the user_vectors table with the new values
  UPDATE user_vectors uv
  SET
    vector = nv.new_user_vector,
    bias = nv.new_user_bias,
    updated_at = NOW()
  FROM new_values nv, constants c
  WHERE uv.user_id = c.user_id
  RETURNING uv.user_id
)
-- Update the recipe_vectors table with the new values
UPDATE recipe_vectors rv
SET
  vector = nv.new_recipe_vector,
  bias = nv.new_recipe_bias,
  updated_at = NOW()
FROM new_values nv, constants c
WHERE rv.recipe_id = c.recipe_id;
"""


@app.post("/pubsub/push")
async def pubsub_push(body: PubSubPushRequest):
    rating_event = None
    try:
        data_str = base64.b64decode(body.message.data).decode("utf-8")
        rating_event = RatingEvent.model_validate_json(data_str)

        params = {
            "learning_rate": 0.01,
            "regularization": 0.02,
            "user_id": rating_event.user_id,
            "recipe_id": rating_event.recipe_id,
            "rating": rating_event.rating,
        }

    except (ValidationError, json.JSONDecodeError) as e:
        logger.warning(f"Bad message format, discarding: {e}")
        return "", 204 

    try:
        with psycopg2.connect(DATABASE_URL) as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT EXISTS(SELECT 1 FROM user_vectors WHERE user_id = %s)
                    AND EXISTS(SELECT 1 FROM recipe_vectors WHERE recipe_id = %s)
                """, (rating_event.user_id, rating_event.recipe_id))
                
                vectors_exist = cur.fetchone()[0]
                if not vectors_exist:
                    logger.warning(f"Missing vectors for user {rating_event.user_id} or recipe {rating_event.recipe_id}")
                    return "", 204
                
                cur.execute(SGD_UPDATE_QUERY, params)
                conn.commit()

        logger.info(f"Successfully processed rating for user {rating_event.user_id}")
        return "", 204

    except Exception as e:
        logger.error(f"Error processing message: {e}")
        raise HTTPException(status_code=500, detail="Error processing message")


@app.get("/health")
def health():
    return {"status": "ok"}
