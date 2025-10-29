import os
import pandas as pd
import numpy as np
import json
import requests
import logging
from dotenv import load_dotenv
import psycopg2 as pg
from google.cloud import storage
from datetime import datetime
from surprise import SVD, Dataset, Reader
import faiss
from extract import Extract
import tempfile
from google.auth.transport.requests import Request
from google.oauth2 import id_token
import psycopg2.extras

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

load_dotenv()
DB_NAME = os.getenv("MONGODB_DATABASE")
INTERNAL_RATINGS_COLLECTION = os.getenv("MONGODB_REVIEWS_COLLECTION")
EXTERNAL_RATINGS_COLLECTION = os.getenv("MONGODB_EXTERNAL_REVIEWS_COLLECTION")
RELOAD_URL = os.getenv("RELOAD_URL")


class Train:
    def __init__(self, n_factors=100, n_epochs=30, random_state=42):
        self.algo = SVD(
            n_factors=n_factors,
            n_epochs=n_epochs,
            random_state=random_state,
            verbose=True,
        )

        logger.info("Connecting to Google Cloud Storage...")
        try:
            self.storage_client = storage.Client()
            self.bucket_name = os.getenv("GCS_BUCKET_NAME")
            if not self.bucket_name:
                raise ValueError(
                    "GCS_BUCKET_NAME not found in environment variables."
                )
            logger.info(f"Successfully connected to GCS bucket: {self.bucket_name}")
        except Exception as e:
            logger.error(f"Could not connect to GCS: {e}")
            raise

        self.postgres_client = self.connect_to_postgres()
    
    def connect_to_postgres(self):
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

    def train_model(self, ratings_df):
        logger.info("Starting SVD model training")

        # Data validation and cleaning
        logger.info(f"Original data shape: {ratings_df.shape}")

        # Remove rows with invalid user_id or recipe_id
        valid_data = ratings_df.dropna(subset=["user_id", "recipe_id", "rating"])
        logger.info(f"After removing nulls: {valid_data.shape}")

        # Convert user_id and recipe_id to strings to avoid issues with numeric IDs
        valid_data["user_id"] = valid_data["user_id"].astype(str)
        valid_data["recipe_id"] = valid_data["recipe_id"].astype(str)

        # Remove any empty strings or problematic IDs
        valid_data = valid_data[
            (valid_data["user_id"] != "")
            & (valid_data["user_id"] != "0")
            & (valid_data["user_id"] != "None")
            & (valid_data["recipe_id"] != "")
            & (valid_data["recipe_id"] != "0")
            & (valid_data["recipe_id"] != "None")
        ]
        logger.info(f"After filtering invalid IDs: {valid_data.shape}")

        reader = Reader(rating_scale=(1, 5))
        data = Dataset.load_from_df(
            valid_data[["user_id", "recipe_id", "rating"]], reader
        )
        trainset = data.build_full_trainset()

        logger.info("Training SVD algorithm...")
        self.algo.fit(trainset)
        logger.info("Model training completed successfully")

        global_mean = float(trainset.global_mean)
        user_bias = {trainset.to_raw_uid(i): float(self.algo.bu[i]) for i in range(trainset.n_users)}
        item_bias = {trainset.to_raw_iid(i): float(self.algo.bi[i]) for i in range(trainset.n_items)}

        logger.info(f"Training results - Global mean: {global_mean:.3f}, Users: {len(user_bias)}, Items: {len(item_bias)}")

        return self.algo, trainset, global_mean, user_bias, item_bias

    def extract_embeddings(self, algo, trainset):
        logger.info("Extracting embeddings from trained model")
        user_embeddings_raw = algo.pu
        recipe_embeddings_raw = algo.qi

        logger.debug(f"Raw embeddings - Users: {user_embeddings_raw.shape}, Recipes: {recipe_embeddings_raw.shape}")
        logger.debug(f"Trainset size - Users: {trainset.n_users}, Items: {trainset.n_items}")

        # Map internal surprise IDs back to application original IDs
        user_id_map = {}
        for inner_uid in range(trainset.n_users):
            try:
                original_uid = trainset.to_raw_uid(inner_uid)
                user_id_map[inner_uid] = original_uid
            except Exception as e:
                logger.warning(f"Could not map inner user ID {inner_uid}: {e}")
                continue

        recipe_id_map = {}
        for inner_iid in range(trainset.n_items):
            try:
                original_iid = trainset.to_raw_iid(inner_iid)
                recipe_id_map[inner_iid] = original_iid
            except Exception as e:
                logger.warning(f"Could not map inner item ID {inner_iid}: {e}")
                continue

        logger.info(f"Successfully mapped {len(user_id_map)} users and {len(recipe_id_map)} recipes")

        user_embeddings = {
            user_id_map[inner_id]: user_embeddings_raw[inner_id]
            for inner_id in user_id_map
        }
        recipe_embeddings = {
            recipe_id_map[inner_id]: recipe_embeddings_raw[inner_id]
            for inner_id in recipe_id_map
        }

        logger.info(f"Extracted embeddings - Users: {len(user_embeddings)}, Recipes: {len(recipe_embeddings)}")
        return user_embeddings, recipe_embeddings

    def save_to_gcs(self, filename, data_dict):
        logger.info(f"Uploading {filename} to GCS")
        try:
            bucket = self.storage_client.bucket(self.bucket_name)
            blob = bucket.blob(filename)

            json_data = json.dumps(data_dict)

            blob.upload_from_string(json_data, content_type="application/json")
            logger.info(f"Successfully uploaded {filename} to GCS")
        except Exception as e:
            logger.error(f"Failed to upload {filename} to GCS: {e}")

    def save_user_embeddings_individually(self, user_embeddings):
        logger.info(f"Uploading {len(user_embeddings)} individual user embeddings to GCS")
        bucket = self.storage_client.bucket(self.bucket_name)

        failed_uploads = 0
        for user_id, embedding_array in user_embeddings.items():
            filename = f"user_embeddings/{user_id}.json"
            blob = bucket.blob(filename)

            embedding_list = embedding_array
            json_data = json.dumps(embedding_list)

            try:
                blob.upload_from_string(json_data, content_type="application/json")
            except Exception as e:
                logger.error(f"Failed to upload embedding for user {user_id}: {e}")
                failed_uploads += 1
                continue

        if failed_uploads > 0:
            logger.warning(f"Failed to upload {failed_uploads} user embeddings")
        logger.info("Individual user embedding upload completed")

    def run_pipeline(self, ratings_df, run_comparison=False):
        logger.info("Starting training pipeline")
        
        algo, trainset, global_mean, user_bias, item_bias = self.train_model(ratings_df)
        user_embeds, recipe_embeds = self.extract_embeddings(algo, trainset)

        internal_user_embeddings = {
            uid: embed.tolist()
            for uid, embed in user_embeds.items()
            if not str(uid).startswith("ext_")
        }
        logger.info(f"Filtered to {len(internal_user_embeddings)} internal user embeddings (excluded external users)")

        logger.info("Saving artifacts to storage systems")
        self.save_user_embeddings_individually(internal_user_embeddings)
        self.save_user_embeddings_to_postgres_batch(internal_user_embeddings)

        recipe_embeddings_dict = {
            recipe_id: embed.tolist() 
            for recipe_id, embed in recipe_embeds.items()
        }
        self.save_recipe_embeddings_to_postgres_batch(recipe_embeddings_dict)

        logger.info("Saving model biases to GCS")
        self.save_to_gcs("global_mean.json", {"global_mean": global_mean})
        self.save_to_gcs("user_bias.json", user_bias)
        self.save_to_gcs("item_bias.json", item_bias)

        logger.info("Saving recipe embeddings to FAISS index")
        self.save_to_faiss(recipe_embeds)

        if run_comparison and internal_user_embeddings:
            logger.info("Running search method comparison")
            first_user_id = next(iter(internal_user_embeddings))
            user_vector = np.array(internal_user_embeddings[first_user_id])
            comparison_results = self.compare_search_methods(recipe_embeds, user_vector)
            if comparison_results:
                logger.info(f"Search comparison completed - Recall@50: {comparison_results['recall_at_k']:.3f}")

        self.reload_recommender_index()
        logger.info("Training pipeline completed successfully")

    def save_to_faiss(self, recipe_embeddings):
        logger.info("Building FAISS index and uploading to GCS")

        recipe_ids = list(recipe_embeddings.keys())
        recipe_embeddings_array = np.array(
            [recipe_embeddings[r] for r in recipe_ids], dtype="float32"
        )
        D = recipe_embeddings_array.shape[1]
        M = 40

        logger.info(f"Creating HNSW index with {len(recipe_ids)} recipes, dimension {D}")
        index = faiss.IndexHNSWFlat(D, M, faiss.METRIC_INNER_PRODUCT)
        index.hnsw.efConstruction = 400
        index.hnsw.efSearch = 192

        index.add(recipe_embeddings_array)

        with tempfile.NamedTemporaryFile(delete=False, suffix=".index") as temp_file:
            faiss.write_index(index, temp_file.name)

        try:
            bucket = self.storage_client.bucket(self.bucket_name)
            
            # Upload FAISS index
            blob = bucket.blob("faiss_index.index")
            blob.upload_from_filename(
                temp_file.name, content_type="application/octet-stream"
            )
            logger.info("Successfully uploaded FAISS index to GCS")

            # Upload recipe IDs
            np.save("/tmp/recipe_ids.npy", np.array(recipe_ids, dtype=object))
            blob = bucket.blob("recipe_ids.npy")
            blob.upload_from_filename("/tmp/recipe_ids.npy", content_type="application/octet-stream")
            logger.info("Successfully uploaded recipe IDs to GCS")

            # Upload recipe factors
            np.save("/tmp/recipe_factors.npy", recipe_embeddings_array)
            blob = bucket.blob("recipe_factors.npy")
            blob.upload_from_filename("/tmp/recipe_factors.npy", content_type="application/octet-stream")
            logger.info("Successfully uploaded recipe factors to GCS")

        finally:
            # Clean up temporary files
            for temp_path in [temp_file.name, "/tmp/recipe_ids.npy", "/tmp/recipe_factors.npy"]:
                if os.path.exists(temp_path):
                    os.remove(temp_path)
            logger.debug("Temporary files cleaned up")

    def reload_recommender_index(self):
        if not RELOAD_URL:
            logger.warning("RELOAD_URL not set, skipping index reload")
            return
        
        logger.info("Reloading recommender index")
        try:
            request = Request()
            token = id_token.fetch_id_token(request, RELOAD_URL)

            headers = {"Authorization": f"Bearer {token}"}
            response = requests.post(f"{RELOAD_URL}/admin/reload_index", headers=headers, timeout=60)
            if response.status_code == 200:
                result = response.json()
                num_recipes = result.get('num_recipes', 'unknown')
                logger.info(f"Successfully reloaded index with {num_recipes} recipes")
            else:
                logger.error(f"Failed to reload index: HTTP {response.status_code} - {response.text}")
        except Exception as e:
            logger.error(f"Unexpected error during index reload: {e}")

    def save_user_embeddings_to_postgres_batch(self, user_embeddings):
        logger.info(f"Saving {len(user_embeddings)} user embeddings to PostgreSQL")
        if not self.postgres_client:
            logger.error("No PostgreSQL client found")
            return
        
        cursor = None
        try:
            cursor = self.postgres_client.cursor()

            insert_data = []
            for user_id, embedding in user_embeddings.items():
                insert_data.append((int(user_id), list(embedding)))

            psycopg2.extras.execute_values(
                cursor,
                """
                INSERT INTO user_vectors (user_id, vector, updated_at) 
                VALUES %s
                ON CONFLICT (user_id) 
                DO UPDATE SET 
                    vector = EXCLUDED.vector,
                    updated_at = NOW()
                """,
                insert_data,
                template="(%s, %s, NOW())"
            )

            self.postgres_client.commit()
            logger.info(f"Successfully saved {len(user_embeddings)} user embeddings to PostgreSQL")
        except Exception as e:
            logger.error(f"Failed to save user embeddings to PostgreSQL: {e}")
            if self.postgres_client:
                self.postgres_client.rollback()
            raise
        finally:
            if cursor:
                cursor.close()

    def save_recipe_embeddings_to_postgres_batch(self, recipe_embeddings):
        logger.info(f"Saving {len(recipe_embeddings)} recipe embeddings to PostgreSQL")
        if not self.postgres_client:
            logger.error("No PostgreSQL client found")
            return
        
        cursor = None
        try:
            cursor = self.postgres_client.cursor()

            cursor.execute("DELETE FROM recipe_vectors")
            logger.info("Cleared existing recipe vectors")

            insert_data = []
            for recipe_id, recipe_embedding in recipe_embeddings.items():
                insert_data.append((int(recipe_id), list(recipe_embedding)))

            psycopg2.extras.execute_values(
                cursor,
                """
                INSERT INTO recipe_vectors (recipe_id, vector, updated_at)
                VALUES %s
                """,
                insert_data,
                template="(%s, %s, NOW())",
                page_size=1000
            )

            self.postgres_client.commit()
            logger.info(f"Successfully saved {len(recipe_embeddings)} recipe embeddings to PostgreSQL")
        except Exception as e:
            logger.error(f"Failed to save recipe embeddings to PostgreSQL: {e}")
            if self.postgres_client:
                self.postgres_client.rollback()
            raise
        finally:
            if cursor:
                cursor.close()

    def compare_search_methods(self, recipe_embeddings, user_vector, top_k=50):
        logger.info(f"Comparing search methods (Top-{top_k})")
        
        recipe_ids = list(recipe_embeddings.keys())
        recipe_embeddings_array = np.array(
            [recipe_embeddings[r] for r in recipe_ids], dtype="float32"
        )
        user_vector = user_vector.reshape(1, -1).astype("float32")
        
        logger.info("Running brute force search for baseline...")
        dim = recipe_embeddings_array.shape[1]
        index_flat = faiss.IndexFlatIP(dim)  # exact inner product
        index_flat.add(recipe_embeddings_array)
        
        distances_exact, indices_exact = index_flat.search(user_vector, top_k)
        exact_top_k = indices_exact[0].tolist()
        exact_scores = distances_exact[0].tolist()
        
        logger.debug(f"Exact top-5 indices: {exact_top_k[:5]}")
        logger.debug(f"Exact top-5 scores: {exact_scores[:5]}")
        
        logger.info("Running HNSW search...")
        try:
            bucket = self.storage_client.bucket(self.bucket_name)
            
            with tempfile.NamedTemporaryFile(delete=False, suffix=".index") as temp_index:
                blob = bucket.blob("faiss_index.index")
                blob.download_to_filename(temp_index.name)
                hnsw_index = faiss.read_index(temp_index.name)
            
            hnsw_index.hnsw.efSearch = 192
            distances_hnsw, indices_hnsw = hnsw_index.search(user_vector, top_k)
            hnsw_top_k = indices_hnsw[0].tolist()
            hnsw_scores = distances_hnsw[0].tolist()
            
            logger.debug(f"HNSW top-5 indices: {hnsw_top_k[:5]}")
            logger.debug(f"HNSW top-5 scores: {hnsw_scores[:5]}")
            
            overlap = len(set(exact_top_k) & set(hnsw_top_k))
            recall_at_k = overlap / top_k
            
            mismatches = [i for i in hnsw_top_k if i not in exact_top_k]
            missed = [i for i in exact_top_k if i not in hnsw_top_k]
            
            exact_recipe_ids = [recipe_ids[i] for i in exact_top_k[:5]]
            hnsw_recipe_ids = [recipe_ids[i] for i in hnsw_top_k[:5]]
            
            results = {
                "recall_at_k": recall_at_k,
                "overlap_count": overlap,
                "total_k": top_k,
                "exact_top_5_recipe_ids": exact_recipe_ids,
                "hnsw_top_5_recipe_ids": hnsw_recipe_ids,
                "exact_top_5_scores": exact_scores[:5],
                "hnsw_top_5_scores": hnsw_scores[:5],
                "mismatches_count": len(mismatches),
                "missed_count": len(missed)
            }
            
            logger.info(f"Search comparison results:")
            logger.info(f"  Recall@{top_k}: {recall_at_k:.3f}")
            logger.info(f"  Overlap: {overlap}/{top_k}")
            logger.info(f"  HNSW mismatches: {len(mismatches)}")
            logger.info(f"  Exact results missed by HNSW: {len(missed)}")
            logger.debug(f"  Exact top-5 recipe IDs: {exact_recipe_ids}")
            logger.debug(f"  HNSW top-5 recipe IDs: {hnsw_recipe_ids}")
            
            return results
            
        except Exception as e:
            logger.error(f"Failed to compare search methods: {e}")
            return None
        finally:
            if 'temp_index' in locals() and os.path.exists(temp_index.name):
                os.remove(temp_index.name)

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1:
        if sys.argv[1] == "train-with-comparison":
            run_comparison = True
        else:
            logger.info("Usage:")
            logger.info("  python train.py                    # Normal training pipeline")
            logger.info("  python train.py train-with-comparison  # Training pipeline with comparison")
            exit()
    else:
        run_comparison = False

    logger.info("Starting SVD training script")
    
    extractor = Extract()
    if not extractor.client:
        logger.error("Could not connect to MongoDB. Exiting.")
        exit(1)

    logger.info("Extracting ratings data from MongoDB")
    ratings_df = extractor.get_combined_ratings_data(
        database_name=DB_NAME,
        internal_collection_name=INTERNAL_RATINGS_COLLECTION,
        external_collection_name=EXTERNAL_RATINGS_COLLECTION,
    )

    if ratings_df is None:
        logger.error("Could not retrieve ratings data. Exiting.")
        exit(1)

    trainer = Train()
    trainer.run_pipeline(ratings_df, run_comparison=run_comparison)
    logger.info("SVD training script completed")
