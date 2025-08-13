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

GLOBAL_MEAN_BLOB = os.getenv("GLOBAL_MEAN_BLOB", "global_mean.json")
USER_BIAS_BLOB = os.getenv("USER_BIAS_BLOB", "user_bias.json")
RECIPE_BIAS_BLOB = os.getenv("RECIPE_BIAS_BLOB", "item_bias.json")
RECIPE_FACTORS_BLOB = os.getenv("RECIPE_FACTORS_BLOB", "recipe_factors.npy")

app = FastAPI()
storage_client = storage.Client()

faiss_index: faiss.Index = None
recipe_ids: np.ndarray = None
global_mean_rating: float = None
user_bias_terms: dict = None
recipe_bias_terms: dict = None
recipe_feature_vectors: np.ndarray = None
index_lock = threading.Lock()


def load_data():
    global faiss_index, recipe_ids, recipe_feature_vectors, user_bias_terms, recipe_bias_terms, global_mean_rating
    bucket = storage_client.bucket(BUCKET_NAME)

    # Load FAISS index
    index_path = "/tmp/faiss_index.index"
    bucket.blob(HNSW_INDEX_BLOB_NAME).download_to_filename(index_path)
    faiss_index = faiss.read_index(index_path)
    faiss_index.hnsw.efSearch = 192

    # Load recipe IDs and feature vectors
    ids_path = "/tmp/recipe_ids.npy"
    vectors_path = "/tmp/recipe_factors.npy"
    bucket.blob(RECIPE_IDS_BLOB_NAME).download_to_filename(ids_path)
    bucket.blob(RECIPE_FACTORS_BLOB).download_to_filename(vectors_path)
    recipe_ids = np.load(ids_path, allow_pickle=True)
    recipe_feature_vectors = np.load(vectors_path).astype(np.float32)

    # Load bias terms and global mean
    global_mean_data = json.loads(bucket.blob(GLOBAL_MEAN_BLOB).download_as_text())["global_mean"]
    user_bias_terms = json.loads(bucket.blob(USER_BIAS_BLOB).download_as_text())
    recipe_bias_terms = json.loads(bucket.blob(RECIPE_BIAS_BLOB).download_as_text())

    with index_lock:
        faiss_index = faiss_index
        recipe_ids = recipe_ids
        recipe_feature_vectors = recipe_feature_vectors
        user_bias_terms = user_bias_terms
        recipe_bias_terms = recipe_bias_terms
        global_mean_rating = float(global_mean_data)

    assert faiss_index.ntotal == recipe_ids.shape[0] == recipe_feature_vectors.shape[0], "mismatched lengths"
    assert recipe_feature_vectors.dtype == np.float32

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
    load_data()
    print(f"Loaded FAISS index with {recipe_ids.shape[0]} recipes")


class UserRecommendationRequest(BaseModel):
    user_id: str


class RecommendResponse(BaseModel):
    recipe_ids: List[str]
    distances: List[float]


@app.post("/recommend", response_model=RecommendResponse)
def recommend(request: UserRecommendationRequest, k: int = 50):
    max_candidates = 250

    user_feature_vector = get_user_feature_vector(request.user_id)
    user_features = np.array(user_feature_vector, dtype=np.float32).reshape(1, -1)
    user_bias = float(user_bias_terms.get(request.user_id, 0.0))

    with index_lock:
        _, candidate_indices = faiss_index.search(user_features, max_candidates)

    candidate_rows = candidate_indices[0]
    candidate_recipe_ids = recipe_ids[candidate_rows]
    candidate_recipe_features = recipe_feature_vectors[candidate_rows]
    candidate_recipe_bias_terms = np.array([recipe_bias_terms.get(recipe_id, 0.0) for recipe_id in candidate_recipe_ids], dtype=np.float32)

    feature_similarities = candidate_recipe_features @ user_features.ravel()
    predicted_ratings = global_mean_rating + user_bias + candidate_recipe_bias_terms + feature_similarities

    rating_order = np.argsort(-predicted_ratings)
    top_k_indices = rating_order[:min(k, predicted_ratings.shape[0])]
    top_recipe_ids = candidate_recipe_ids[top_k_indices].tolist()
    top_rating_scores = predicted_ratings[top_k_indices].astype(float).tolist()

    return RecommendResponse(recipe_ids=top_recipe_ids, distances=top_rating_scores)

@app.post("/admin/reload_index")
def reload_index():
    try:
        load_data()
        return {"status": "reloaded", "num_recipes": recipe_ids.shape[0]}
    except Exception as e:
        raise HTTPException(500, f"Reload failed: {e}")


@app.get("/health")
def health():
    return {"status": "ok"}
