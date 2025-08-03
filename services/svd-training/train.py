import os
import pandas as pd
import numpy as np
import json
import requests
from dotenv import load_dotenv
from google.cloud import storage
from surprise import SVD, Dataset, Reader
import faiss
from extract import Extract
import tempfile

load_dotenv()
DB_NAME = os.getenv("MONGODB_DATABASE")
INTERNAL_RATINGS_COLLECTION = os.getenv("MONGODB_REVIEWS_COLLECTION")
EXTERNAL_RATINGS_COLLECTION = os.getenv("MONGODB_EXTERNAL_REVIEWS_COLLECTION")
RELOAD_URL = os.getenv("RELOAD_URL")


class Train:
    def __init__(self, n_factors=100, n_epochs=20, random_state=42):
        self.algo = SVD(
            n_factors=n_factors,
            n_epochs=n_epochs,
            random_state=random_state,
            verbose=True,
        )

        print("Connecting to Google Cloud Storage...")
        try:
            self.storage_client = storage.Client()
            self.bucket_name = os.getenv("GCS_BUCKET_NAME")
            if not self.bucket_name:
                raise ValueError(
                    "FATAL: GCS_BUCKET_NAME not found in environment variables."
                )
            print(f"Successfully connected and targeting bucket: {self.bucket_name}")
        except Exception as e:
            print(f"FATAL: Could not connect to GCS: {e}")
            raise

    def train_model(self, ratings_df):
        print("--- Training SVD Model ---")

        # Data validation and cleaning
        print(f"Original data shape: {ratings_df.shape}")

        # Remove rows with invalid user_id or recipe_id
        valid_data = ratings_df.dropna(subset=["user_id", "recipe_id", "rating"])
        print(f"After removing nulls: {valid_data.shape}")

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
        print(f"After filtering invalid IDs: {valid_data.shape}")

        reader = Reader(rating_scale=(1, 5))
        data = Dataset.load_from_df(
            valid_data[["user_id", "recipe_id", "rating"]], reader
        )
        trainset = data.build_full_trainset()

        self.algo.fit(trainset)
        print("--- Model Training Complete ---")
        return self.algo, trainset

    def extract_embeddings(self, algo, trainset):
        print("--- Extracting Embeddings ---")
        user_embeddings_raw = algo.pu
        recipe_embeddings_raw = algo.qi

        print(f"Raw user embeddings shape: {user_embeddings_raw.shape}")
        print(f"Raw recipe embeddings shape: {recipe_embeddings_raw.shape}")
        print(f"Number of users in trainset: {trainset.n_users}")
        print(f"Number of items in trainset: {trainset.n_items}")

        # Map internal surprise IDs back to application original IDs
        user_id_map = {}
        for inner_uid in range(trainset.n_users):
            try:
                original_uid = trainset.to_raw_uid(inner_uid)
                user_id_map[inner_uid] = original_uid
            except Exception as e:
                print(f"Warning: Could not map inner user ID {inner_uid} - {e}")
                continue

        recipe_id_map = {}
        for inner_iid in range(trainset.n_items):
            try:
                original_iid = trainset.to_raw_iid(inner_iid)
                recipe_id_map[inner_iid] = original_iid
            except Exception as e:
                print(f"Warning: Could not map inner item ID {inner_iid} - {e}")
                continue

        print(f"Mapped {len(user_id_map)} users")
        print(f"Mapped {len(recipe_id_map)} recipes")

        user_embeddings = {
            user_id_map[inner_id]: user_embeddings_raw[inner_id]
            for inner_id in user_id_map
        }
        recipe_embeddings = {
            recipe_id_map[inner_id]: recipe_embeddings_raw[inner_id]
            for inner_id in recipe_id_map
        }

        print(f"Extracted {len(user_embeddings)} user embeddings.")
        print(f"Extracted {len(recipe_embeddings)} recipe embeddings.")
        return user_embeddings, recipe_embeddings

    def save_to_gcs(self, filename, data_dict):
        print(f"--- Preparing to upload {filename} to GCS ---")
        try:
            bucket = self.storage_client.bucket(self.bucket_name)
            blob = bucket.blob(filename)

            json_data = json.dumps(data_dict)

            blob.upload_from_string(json_data, content_type="application/json")
            print(f"Successfully uploaded {filename} to GCS bucket {self.bucket_name}.")
        except Exception as e:
            print(f"ERROR: Failed to upload {filename} to GCS: {e}")

    def save_user_embeddings_individually(self, user_embeddings):
        print(
            f"--- Preparing to upload {len(user_embeddings)} individual user embeddings ---"
        )
        bucket = self.storage_client.bucket(self.bucket_name)

        for user_id, embedding_array in user_embeddings.items():
            filename = f"user_embeddings/{user_id}.json"
            blob = bucket.blob(filename)

            embedding_list = embedding_array
            json_data = json.dumps(embedding_list)

            try:
                blob.upload_from_string(json_data, content_type="application/json")
            except Exception as e:
                print(f"ERROR: Failed to upload embedding for user {user_id}: {e}")
                continue

        print("--- Individual user embedding upload complete ---")

    def run_pipeline(self, ratings_df):
        algo, trainset = self.train_model(ratings_df)
        user_embeds, recipe_embeds = self.extract_embeddings(algo, trainset)

        internal_user_embeddings = {
            uid: embed.tolist()
            for uid, embed in user_embeds.items()
            if not str(uid).startswith("ext_")
        }
        print(
            f"Filtered out external users. Saving {len(internal_user_embeddings)} internal user embeddings."
        )

        recipe_embeddings_serializable = {
            k: v.tolist() for k, v in recipe_embeds.items()
        }

        print("\n--- Saving all artifacts to Google Cloud Storage ---")
        print("--- Saving user embeddings to GCS ---")
        self.save_user_embeddings_individually(internal_user_embeddings)

        print("--- Saving recipe embeddings to GCS ---")
        self.save_to_gcs("recipe_embeddings.json", recipe_embeddings_serializable)

        print("--- Saving recipe embeddings to FAISS and uploading to GCS ---")
        self.save_to_faiss(recipe_embeds)

        print("--- Reloading recommender index ---")
        self.reload_recommender_index()

        print("--- Pipeline Complete ---")

    def save_to_faiss(self, recipe_embeddings):
        print("--- Saving recipe embeddings to FAISS and uploading to GCS ---")

        recipe_ids = list(recipe_embeddings.keys())
        recipe_embeddings_array = np.array(
            [recipe_embeddings[r] for r in recipe_ids], dtype="float32"
        )
        D = recipe_embeddings_array.shape[1]
        M = 16

        index = faiss.IndexHNSWFlat(D, M)
        index.hnsw.efConstruction = 200
        index.hnsw.efSearch = 64

        index.add(recipe_embeddings_array)

        with tempfile.NamedTemporaryFile(delete=False, suffix=".index") as temp_file:
            faiss.write_index(index, temp_file.name)

        try:
            bucket = self.storage_client.bucket(self.bucket_name)
            blob = bucket.blob("faiss_index.index")

            blob.upload_from_filename(
                temp_file.name, content_type="application/octet-stream"
            )

            print(f"Successfully uploaded FAISS index to GCS bucket {self.bucket_name}")

            np.save("/tmp/recipe_ids.npy", np.array(recipe_ids, dtype="<U36"))
            blob = bucket.blob("recipe_ids.npy")
            blob.upload_from_filename("/tmp/recipe_ids.npy", content_type="application/octet-stream")

            print(f"Successfully uploaded recipe IDs to GCS bucket {self.bucket_name}")


        finally:
            if os.path.exists(temp_file.name):
                os.remove(temp_file.name)
            if os.path.exists("/tmp/recipe_ids.npy"):
                os.remove("/tmp/recipe_ids.npy")
            print("Temporary files cleaned up")

        print("--- Recipe embeddings saved to FAISS and uploaded to GCS ---")

    def reload_recommender_index(self):
        if not RELOAD_URL:
            print("WARNING: RELOAD_URL not set, skipping index reload")
            return
        
        print("--- Reloading recommender index ---")
        try:
            response = requests.post(f"{RELOAD_URL}/admin/reload_index", timeout=60)
            if response.status_code == 200:
                result = response.json()
                print(f"Successfully reloaded index with {result.get('num_recipes', 'unknown')} recipes")
            else:
                print(f"Failed to reload index: HTTP {response.status_code} - {response.text}")
        except Exception as e:
            print(f"Unexpected error during index reload: {e}")


if __name__ == "__main__":
    extractor = Extract()
    if not extractor.client:
        print("Could not connect to MongoDB. Exiting.")
        exit()

    ratings_df = extractor.get_combined_ratings_data(
        database_name=DB_NAME,
        internal_collection_name=INTERNAL_RATINGS_COLLECTION,
        external_collection_name=EXTERNAL_RATINGS_COLLECTION,
    )

    if ratings_df is None:
        print("Could not retrieve ratings data. Exiting.")
        exit()

    trainer = Train()
    trainer.run_pipeline(ratings_df)
