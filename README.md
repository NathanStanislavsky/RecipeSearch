# PantryChef

PantryChef helps you discover recipes you can make with the ingredients you already have in your pantry! Enter your ingredients, and it fetches relevant recipes using this [Kaggle dataset](https://www.kaggle.com/datasets/shuyangli94/food-com-recipes-and-user-interactions). User's can also rate recipes they've tried and get personalized recommendations.

Built with SvelteKit, Node.js, TypeScript, CockroachDB, and Tailwind CSS.

## Features

- Authentication and session management using JWTs
- Search for recipes by listing available ingredients.
- View detailed recipe information: nutrients, ingredients, directions, yield, etc...
- Personalized recommendation

## Tech Stack

- Frontend: SvelteKit, Tailwind CSS
- Backend: Node.js (within SvelteKit endpoints), TypeScript,
- Recommendation pipeline: Python, Pandas, NumPy, SciKit-Surprise, FAISS, Google Cloud SDK
- Database: CockroachDB, MongoDB, Google Cloud Storage
- Infrastructure: Docker, Google Cloud Run Services & Jobs, GitHub Actions

## Deployment

The application is currently deployed on Vercel at https://recipe-search-psi.vercel.app/. The training script and recommendation API have been containerized and deployed to Google Cloud Run.

# Recipe Recommendations

The `svd-training` service is responsible for training a SVD model to extract user and recipe feature matrices and then creating a Hierarchical Navigable Small World to recommend recipes to users.

## Training Pipeline

The training pipeline performs the following steps:

1. **Data Extraction**: Extracts rating data from MongoDB collections
2. **Model Training**: Trains an SVD (Singular Value Decomposition) model using the Surprise library
3. **Embedding Extraction**: Extracts user and recipe embeddings from the trained model
4. **Storage**: Saves embeddings to Google Cloud Storage
5. **FAISS HNSW Index**: Creates and uploads a FAISS HNSW index for fast similarity search
6. **Index Reload**: Automatically calls the recommender service's reload endpoint to update the live index

## Fetching

Fetching recommendations happens when the user navigates to the recommendation page where their user feature vector is downloaded and sent as the payload for the POST request to the recommendation endpoint deployed on Google Cloud Run. Inside the endpoint the I use the user's feature matrix and traverse the HNSW index (you can read more about how HNSW work online) to find the most similar recipes to the user's taste profile.
