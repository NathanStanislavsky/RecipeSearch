import os
import faiss
import numpy as np
from fastapi import FastAPI, HTTPException
from google.cloud import storage
from pydantic import BaseModel
from typing import List


BUCKET_NAME = os.environ["GCS_BUCKET_NAME"]
HNSW_INDEX_BLOB_NAME = os.environ.get("HNSW_INDEX_BLOB", "faiss_index.index")
RECIPE_IDS_BLOB_NAME = os.environ.get("RECIPE_IDS_BLOB", "recipe_ids.npy")

app = FastAPI()
storage_client = storage.Client()

_index      : faiss.Index   = None
_recipe_ids : np.ndarray    = None

@app.on_event("startup")
def load_faiss_and_data():
    global _index, _recipe_ids

    bucket = storage_client.bucket(BUCKET_NAME)

    index_local = "/tmp/faiss_index.index"
    bucket.blob(HNSW_INDEX_BLOB_NAME) \
          .download_to_filename(index_local)
    _index = faiss.read_index(index_local)
    _index.hnsw.efSearch = 64

    recipe_ids_local = "/tmp/recipe_ids.npy"
    bucket.blob(RECIPE_IDS_BLOB_NAME) \
          .download_to_filename(recipe_ids_local)
    _recipe_ids = np.load(recipe_ids_local)

    print(f"Loaded FAISS index, {_recipe_ids.shape[0]} IDs")

class UserEmbeddingRequest(BaseModel):
    user_embedding: List[float]

class RecommendResponse(BaseModel):
    recipe_ids: list[str]
    distances:  list[float]

@app.post("/recommend", response_model=RecommendResponse)
def recommend(request: UserEmbeddingRequest, k: int = 20):
    user_embedding = request.user_embedding
    if len(user_embedding) != 100:
        raise HTTPException(400, f"User embedding must be exactly 100 dimensions, got {len(user_embedding)}")
    
    user_vector = np.array(user_embedding, dtype=np.float32).reshape(1, -1)

    distances, indices = _index.search(user_vector, k)
    distances = distances[0].tolist()
    indices   = indices[0]

    recipe_ids = _recipe_ids[indices].tolist()

    return RecommendResponse(recipe_ids=recipe_ids, distances=distances)

@app.get("/health")
def health():
    return {"status": "ok"}
