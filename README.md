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

The application is containerized using Docker.

### Building a Docker image

Use the following command to build your Docker image using the secrets from your env:

```
DOCKER_BUILDKIT=1 \
JWT_SECRET=<JWT_SECRET> \
DATABASE_URL=<DATABASE_URL> \
RAPIDAPI_KEY_2=<RAPIDAPI_KEY_2> \
docker build \
  --secret id=jwt,env=JWT_SECRET \
  --secret id=dburl,env=DATABASE_URL \
  --secret id=rapidapi_key,env=RAPIDAPI_KEY_2 \
  -t recipe-search .
```

### Running your Docker Container

Use the following command to run your Docker container using the secrets from your env:

```
docker run -d \
  --name recipe-search \
  -p 3000:3000 \
  -e DATABASE_URL=<DATABASE_URL> \
  -e JWT_SECRET=<JWT_SECRET> \
  -e RAPIDAPI_KEY_2=<RAPIDAPI_KEY_2> \
  recipe-search
```

Make sure that you've built your Docker image prior to running the container. After running the container using the above command you can find your site at http://localhost:3000/

## Deployment

The application is currently deployed on Vercel at https://recipe-search-psi.vercel.app/
