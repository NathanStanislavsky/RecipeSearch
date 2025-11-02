import os
import logging
from dotenv import load_dotenv
import psycopg2 as pg
from google.cloud import storage
from datetime import datetime
from surprise import SVD, Dataset, Reader
from extract import Extract
from google.auth.transport.requests import Request
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

    def run_pipeline(self, ratings_df):
        logger.info("Starting training pipeline")
        
        algo, trainset, global_mean, user_bias, recipe_bias = self.train_model(ratings_df)
        user_embeds, recipe_embeds = self.extract_embeddings(algo, trainset)

        internal_user_embeddings = {
            uid: embed.tolist()
            for uid, embed in user_embeds.items()
            if not str(uid).startswith("ext_")
        }
        logger.info(f"Filtered to {len(internal_user_embeddings)} internal user embeddings (excluded external users)")

        logger.info("Saving artifacts to storage systems")
        self.save_user_embeddings_to_postgres_batch(internal_user_embeddings)

        recipe_embeddings_dict = {
            recipe_id: embed.tolist() 
            for recipe_id, embed in recipe_embeds.items()
        }
        self.save_recipe_embeddings_to_postgres_batch(recipe_embeddings_dict)

        logger.info("Saving model biases to PostgreSQL")
        self.save_bias_terms_to_postgres(user_bias, recipe_bias, global_mean)

        logger.info("Creating HNSW index for recipe vectors")
        self.create_hnsw_index()

        logger.info("Training pipeline completed successfully")

    def create_hnsw_index(self):
        cursor = None
        try:
            cursor = self.postgres_client.cursor()
            
            cursor.execute("SHOW maintenance_work_mem")
            memory_setting = cursor.fetchone()[0]
            logger.info(f"Current maintenance_work_mem: {memory_setting}")

            cursor.execute("SELECT COUNT(*) FROM recipe_vectors")
            vector_count = cursor.fetchone()[0]
            logger.info(f"Building HNSW index for {vector_count} recipe vectors")

            cursor.execute("DROP INDEX IF EXISTS recipe_hnsw_idx")

            cursor.execute("""
                CREATE INDEX recipe_hnsw_idx ON recipe_vectors
                USING hnsw (vector vector_cosine_ops)
                WITH (m = 16, ef_construction = 64)
            """)

            self.postgres_client.commit()
            logger.info("Successfully created HNSW index")
        except Exception as e:
            logger.error(f"Failed to create HNSW index: {e}")
            if self.postgres_client:
                self.postgres_client.rollback()
            raise
        finally:
            if cursor:
                cursor.close()

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

    def save_bias_terms_to_postgres(self, user_bias, recipe_bias, global_mean):
        cursor = None
        try:
            cursor = self.postgres_client.cursor()

            # Filter out external users
            internal_user_bias = {
                user_id: bias 
                for user_id, bias in user_bias.items() 
                if not str(user_id).startswith("ext_")
            }
            
            logger.info(f"Filtered to {len(internal_user_bias)} internal user biases (excluded external users)")

            # Batch update user biases
            if internal_user_bias:
                user_bias_data = [(float(bias), int(user_id)) for user_id, bias in internal_user_bias.items()]
                psycopg2.extras.execute_values(
                    cursor,
                    "UPDATE user_vectors SET bias = data.bias FROM (VALUES %s) AS data(bias, user_id) WHERE user_vectors.user_id = data.user_id",
                    user_bias_data,
                    template="(%s, %s)",
                    page_size=1000
                )
                logger.info(f"Updated {len(internal_user_bias)} user biases")

            # Batch update recipe biases
            recipe_bias_data = [(float(bias), int(recipe_id)) for recipe_id, bias in recipe_bias.items()]
            psycopg2.extras.execute_values(
                cursor,
                "UPDATE recipe_vectors SET bias = data.bias FROM (VALUES %s) AS data(bias, recipe_id) WHERE recipe_vectors.recipe_id = data.recipe_id",
                recipe_bias_data,
                template="(%s, %s)",
                page_size=1000
            )
            logger.info(f"Updated {len(recipe_bias)} recipe biases")
            
            # Insert global mean
            cursor.execute(
                """
                INSERT INTO svd_metadata (id, completion_time, global_mean) 
                VALUES (1, NOW(), %s)
                ON CONFLICT (id) 
                DO UPDATE SET 
                    completion_time = EXCLUDED.completion_time,
                    global_mean = EXCLUDED.global_mean
                """,
                (float(global_mean),)
            )
            
            self.postgres_client.commit()
            logger.info(f"Successfully saved bias terms and global mean to PostgreSQL")
            
        except Exception as e:
            logger.error(f"Failed to save bias terms: {e}")
            if self.postgres_client:
                self.postgres_client.rollback()
            raise
        finally:
            if cursor:
                cursor.close()

if __name__ == "__main__":
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
    trainer.run_pipeline(ratings_df)
    logger.info("SVD training script completed")
