FROM node:20.14.0
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN --mount=type=secret,id=jwt \
    --mount=type=secret,id=dburl \
    --mount=type=secret,id=rapidapi_key_2 \
    --mount=type=secret,id=mongodb_uri \
    --mount=type=secret,id=mongodb_database \
    --mount=type=secret,id=mongodb_collection \
    --mount=type=secret,id=mongodb_search_index \
    export JWT_SECRET="$(cat /run/secrets/jwt)" \
    && export DATABASE_URL="$(cat /run/secrets/dburl)" \
    && export RAPIDAPI_KEY_2="$(cat /run/secrets/rapidapi_key_2)" \
    && export MONGODB_URI="$(cat /run/secrets/mongodb_uri)" \
    && export MONGODB_DATABASE="$(cat /run/secrets/mongodb_database)" \
    && export MONGODB_COLLECTION="$(cat /run/secrets/mongodb_collection)" \
    && export MONGODB_SEARCH_INDEX="$(cat /run/secrets/mongodb_search_index)" \
    && npm run build

EXPOSE 5173
CMD ["npm", "run", "dev"]