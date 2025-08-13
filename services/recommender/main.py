import os
import faiss
import numpy as np
import threading
from fastapi import FastAPI, HTTPException
from google.cloud import storage
from pydantic import BaseModel
from typing import List
from dotenv import load_dotenv

load_dotenv()

BUCKET_NAME = os.getenv("GCS_BUCKET_NAME")
HNSW_INDEX_BLOB_NAME = os.getenv("HNSW_INDEX_BLOB", "faiss_index.index")
RECIPE_IDS_BLOB_NAME = os.getenv("RECIPE_IDS_BLOB", "recipe_ids.npy")

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


@app.on_event("startup")
def startup_event():
    load_index()
    print(f"Loaded FAISS index with {_recipe_ids.shape[0]} recipes")


class UserEmbeddingRequest(BaseModel):
    user_embedding: List[float]


class RecommendResponse(BaseModel):
    recipe_ids: List[str]
    distances: List[float]


@app.post("/recommend", response_model=RecommendResponse)
def recommend(request: UserEmbeddingRequest, k: int = 20):
    if default_idx is None or _recipe_ids is None:
        raise HTTPException(503, "Index not loaded yet")

    user_embedding = request.user_embedding
    if len(user_embedding) != 100:
        raise HTTPException(400, f"User embedding must be exactly 100 dimensions, got {len(user_embedding)}")
    
    user_vector = np.array(user_embedding, dtype=np.float32).reshape(1, -1)

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
