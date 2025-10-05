import base64
import json
from datetime import datetime
from fastapi import FastAPI, HTTPException, Request

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

    # If the timestamp check passes then we need to recompute the user vector by first
    # getting the user vector from the PostgreSQL database and the recipe vector from GCS
    
    # Then we apply the weighted average formula on the user vector

    # Finally we update the user vector in the PostgreSQL database
    

@app.get("/health")
def health():
    return {"status": "ok"}