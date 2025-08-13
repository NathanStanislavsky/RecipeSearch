import os
import faiss
import numpy as np
import threading
import json
from fastapi import FastAPI, HTTPException
from google.cloud import storage
from pydantic import BaseModel
from typing import List
from dotenv import load_dotenv

load_dotenv()

BUCKET_NAME = os.getenv("GCS_BUCKET_NAME")
HNSW_INDEX_BLOB_NAME = os.getenv("HNSW_INDEX_BLOB", "faiss_index.index")
RECIPE_IDS_BLOB_NAME = os.getenv("RECIPE_IDS_BLOB", "recipe_ids.npy")
USER_EMBEDDINGS_FOLDER = os.getenv("USER_EMBEDDINGS_FOLDER", "user_embeddings")

app = FastAPI()
storage_client = storage.Client()

default_idx: faiss.Index = None
_recipe_ids: np.ndarray = None
_index_lock = threading.Lock()


def load_index():
    global default_idx, _recipe_ids
    bucket = storage_client.bucket(BUCKET_NAME)

    index_local_path = "/tmp/faiss_index.index"
    bucket.blob(HNSW_INDEX_BLOB_NAME).download_to_filename(index_local_path)
    index = faiss.read_index(index_local_path)
    index.hnsw.efSearch = 192

    ids_local_path = "/tmp/recipe_ids.npy"
    bucket.blob(RECIPE_IDS_BLOB_NAME).download_to_filename(ids_local_path)
    ids = np.load(ids_local_path)

    with _index_lock:
        default_idx = index
        _recipe_ids = ids


def get_user_feature_vector(user_id: str) -> List[float]:
    try:
        bucket = storage_client.bucket(BUCKET_NAME)
        blob_path = f"{USER_EMBEDDINGS_FOLDER}/{user_id}.json"
        blob = bucket.blob(blob_path)
        
        if not blob.exists():
            raise HTTPException(404, f"User embedding not found for user_id: {user_id}")
        
        content = blob.download_as_text()
        user_feature_vector = json.loads(content)
        
        if len(user_feature_vector) != 100:
            raise HTTPException(400, f"User embedding must be exactly 100 dimensions, got {len(user_feature_vector)}")
        
        return user_feature_vector
        
    except json.JSONDecodeError:
        raise HTTPException(500, f"Invalid JSON format in user embedding for user_id: {user_id}")
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(500, f"Failed to retrieve user embedding: {str(e)}")


@app.on_event("startup")
def startup_event():
    load_index()
    print(f"Loaded FAISS index with {_recipe_ids.shape[0]} recipes")


class UserRecommendationRequest(BaseModel):
    user_id: str


class RecommendResponse(BaseModel):
    recipe_ids: List[str]
    distances: List[float]


@app.post("/recommend", response_model=RecommendResponse)
def recommend(request: UserRecommendationRequest, k: int = 20):
    user_feature_vector = get_user_feature_vector(request.user_id)
    user_vector = np.array(user_feature_vector, dtype=np.float32).reshape(1, -1)

    with _index_lock:
        distances, indices = default_idx.search(user_vector, k)
        recipe_ids = _recipe_ids[indices[0]].tolist()

    return RecommendResponse(recipe_ids=recipe_ids, distances=distances[0].tolist())


@app.post("/admin/reload_index")
def reload_index():
    try:
        load_index()
        return {"status": "reloaded", "num_recipes": _recipe_ids.shape[0]}
    except Exception as e:
        raise HTTPException(500, f"Reload failed: {e}")


@app.get("/health")
def health():
    return {"status": "ok"}
