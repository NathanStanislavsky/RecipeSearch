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
    pass

@app.get("/health")
def health():
    return {"status": "ok"}