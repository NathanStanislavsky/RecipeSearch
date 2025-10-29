import base64
import json
from datetime import datetime
from fastapi import FastAPI, HTTPException, Request
from dotenv import load_dotenv
import os
import psycopg2 as pg
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

load_dotenv()
app = FastAPI()

@app.post('/recompute')
async def handle_rating_event(request: Request):
    try:
        body = await request.json()

        if 'message' not in body:
            return {'status': 'no message'}
        
        message_data = body['message']
        
        if "data" in message_data:
            base_64_data = message_data["data"]
            decoded_data = base64.b64decode(base_64_data)
            rating_event = json.loads(decoded_data)

            await process_rating_event(rating_event)
        
        return {'status': 'success'}

    except Exception as e:
        print(f"Error recomputing: {str(e)}")
        raise HTTPException(500, f"Error recomputing: {str(e)}")

async def process_rating_event(rating_event: dict):
    user_id = rating_event['user_id']
    recipe_id = rating_event['recipe_id']
    rating = rating_event['rating']
    rating_timestamp = datetime.fromtimestamp(rating_event['timestamp'])

    if not all([user_id, recipe_id, rating, rating_timestamp]):
        print(f"Invalid rating event: {rating_event}")
        return
    
    # Retrieve the last SVD completion time and if the rating_timestamp is older than
    # that, then we don't need to recompute since it's already been incorporated by SVD
    # we sack the message and return
    last_svd_completion_time = get_last_svd_completion_time()
    if rating_timestamp < last_svd_completion_time:
        print(f"Rating timestamp {rating_timestamp} is older than last SVD completion time {last_svd_completion_time}. Skipping recomputation.")
        return

    # If the timestamp check passes then we need to recompute the user vector by first
    # getting the user vector from the PostgreSQL database and the recipe vector from GCS
    user_vector = get_user_vector(user_id)
    recipe_vector = get_recipe_vector(recipe_id)
    
    # Then we apply the SGD average formula on the user vector
    new_user_vector = sgd_average(user_vector, recipe_vector, rating)

    # Finally we update the user vector in the PostgreSQL database
    update_user_vector(user_id, new_user_vector)

def get_last_svd_completion_time():
    pass

def get_user_vector(user_id: int):
    cursor = None
    try:
        cursor = connect_to_postgres().cursor()
        cursor.execute("SELECT vector FROM user_vectors WHERE user_id = %s", (user_id,))
        result = cursor.fetchone()
        return result[0]
    except Exception as e:
        print(f"Error getting user vector: {e}")
        return None
    finally:
        if cursor:
            cursor.close()

def get_recipe_vector(recipe_id: int):
    cursor = None
    conn = None
    try:
        conn = connect_to_postgres()
        cursor = conn.cursor()
        cursor.execute("SELECT vector FROM recipe_vectors WHERE recipe_id = %s", (recipe_id,))
        result = cursor.fetchone()

        if result:
            return result[0]
        else:
            print(f"Recipe vector not found for recipe_id: {recipe_id}")
            return None
    except Exception as e:
        print(f"Error getting recipe vector: {e}")
        return None
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


def sgd_average(user_vector: list[float], recipe_vector: list[float], rating: float):
    pass

def update_user_vector(user_id: int, new_user_vector: list[float]):
    cursor = None
    conn = None
    try:
        conn = connect_to_postgres()
        cursor = conn.cursor()
        cursor.execute("UPDATE user_vectors SET vector = %s WHERE user_id = %s", (new_user_vector, user_id))
    except Exception as e:
        print(f"Error updating user vector: {e}")
        return None
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

def connect_to_postgres():
    logger.info("Connecting to PostgreSQL...")
    if os.getenv("DATABASE_URL"):
        try:
            conn = pg.connect(os.getenv("DATABASE_URL"))
            logger.info("Successfully connected to PostgreSQL")
            return conn
        except Exception as e:
            logger.error(f"Could not connect to PostgreSQL: {e}")
            raise
    else:
        logger.error("DATABASE_URL not found in environment variables")
        raise ValueError("DATABASE_URL not found")

@app.get("/health")
def health():
    return {"status": "ok"}