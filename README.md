# PantryChef

PantryChef helps you discover recipes you can make with the ingredients you already have in your pantry! Enter your ingredients, and it fetches relevant recipes using the [Spoonacular API](https://rapidapi.com/spoonacular/api/recipe-food-nutrition)..

Built with SvelteKit, Node.js, TypeScript, Neon Serverless PostgreSQL, and Tailwind CSS.

## Features

- Search for recipes by listing available ingredients.
- View detailed recipe information: image, link to recipe, preparation time, yield

## Tech Stack

- Frontend: SvelteKit, Tailwind CSS
- Backend: Node.js (within SvelteKit endpoints), TypeScript
- Database: Neon Serverless PostgreSQL
- API: Spoonacular (via RapidAPI)

## Getting Started

### Prerequisites

- Node.js (v20 or newer recommended)
- npm (or yarn/pnpm)
- Git
- A free account on [RapidAPI](https://rapidapi.com/hub) to get a Spoonacular API key.
- A free account and database setup on [Neon](https://neon.tech/).

### Installation & Setup

1.  **Clone the repository:**

    ```bash
    git clone [https://github.com/NathanStanislavsky/RecipeSearch.git](https://github.com/NathanStanislavsky/RecipeSearch.git)
    cd pantrychef
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    # or yarn install / pnpm install
    ```

3.  **Set up environment variables:**

    - Create a `.env` file
    - Open the `.env` file and add your credentials:
      - `RAPIDAPI_KEY_2`: Your API key from [RapidAPI Hub](https://rapidapi.com/hub) for the Spoonacular API.
      - `DATABASE_URL`: Your database connection string (pooled connection recommended) from [Neon](https://neon.tech/).
      - `JWT_SECRET`: A long, random, secret string of your choice for encrypting session tokens.

4.  **Database Migration:**

    - Migrate databse: `npx prisma migrate dev`

5.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The application should now be running on `http://localhost:5173` (or the port specified).

## Available Scripts

- `npm run dev`: Starts the development server.
- `npm test`: Runs tests
- `npm test:unit`: Runs unit tests
- `npm test:e2e`: Runs e2e tests
- `npm run lint`: Lints the codebase.
- `npm run format`: Formats the codebase.

## Docker

Spin up a development server using Docker.

### Define environment variables in shell

```bash
export JWT_SECRET=<your_jwt>
export DATABASE_URL=<your_db_url>
export RAPIDAPI_KEY_2=<your_rapidapi_key>
export MONGODB_URI=<your_mongo_uri>
export MONGODB_DATABASE=<your_mongo_db>
export MONGODB_COLLECTION=<your_mongo_collection>
export MONGODB_SEARCH_INDEX=<your_mongo_search_index>
```

````
### Building a Docker image

Use the following command to build your Docker image using the secrets from your env:

```bash
docker build --secret id=jwt,env=JWT_SECRET --secret id=dburl,env=DATABASE_URL --secret id=rapidapi_key_2,env=RAPIDAPI_KEY_2 --secret id=mongodb_uri,env=MONGODB_URI --secret id=mongodb_database,env=MONGODB_DATABASE --secret id=mongodb_collection,env=MONGODB_COLLECTION --secret id=mongodb_search_index,env=MONGODB_SEARCH_INDEX -t recipe-search .
````

### Running your Docker Container

Use the following command to run your Docker container using the secrets from your env:

```bash
docker run -p 5173:5173 -e JWT_SECRET=<your_jwt> -e DATABASE_URL=<your_db_url> -e RAPIDAPI_KEY_2=<your_rapidapi_key> -e MONGODB_URI=<your_mongo_uri> -e MONGODB_DATABASE=<your_mongo_db> -e MONGODB_COLLECTION=<your_mongo_collection> -e MONGODB_SEARCH_INDEX=<your_mongo_search_index> recipe-search
```

Make sure that you've built your Docker image prior to running the container. After running the container using the above command you can find your site at http://localhost:3000/

## Deployment

The application is currently deployed on Vercel at https://recipe-search-psi.vercel.app/

# RecipeRecommendations

The `svd-training` service is responsible for training a SVD model to extract user and recipe feature matrices and then creating a Hierarchical Navigable Small World to recommend recipes to users.

## Training Pipeline

The training pipeline performs the following steps:

1. **Data Extraction**: Extracts rating data from MongoDB collections
2. **Model Training**: Trains an SVD (Singular Value Decomposition) model using the Surprise library
3. **Embedding Extraction**: Extracts user and recipe embeddings from the trained model
4. **Storage**: Saves embeddings to Google Cloud Storage
5. **FAISS Index**: Creates and uploads a FAISS index for fast similarity search
6. **Index Reload**: Automatically calls the recommender service's reload endpoint to update the live index

## Environment Variables

Required environment variables:
- `MONGODB_DATABASE`: MongoDB database name
- `MONGODB_REVIEWS_COLLECTION`: Internal reviews collection name
- `MONGODB_EXTERNAL_REVIEWS_COLLECTION`: External reviews collection name
- `GCS_BUCKET_NAME`: Google Cloud Storage bucket name
- `RELOAD_URL`: URL of the recommender service (e.g., `http://recommender:8080`)

## Running the Pipeline

The pipeline can be run using Docker Compose:

```bash
docker-compose up svd-training
```

Or directly with Python:

```bash
python train.py
```

After completion, the recommender service will automatically reload its index with the new embeddings.
