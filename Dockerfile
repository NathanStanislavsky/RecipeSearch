# syntax=docker/dockerfile:1.4
FROM node:20.14.0 AS builder
WORKDIR /app

# 1) install deps & playwright
COPY package*.json ./
RUN npm ci
RUN npx playwright install --with-deps

# 2) copy entire source, run tests & build
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
    && npm test && npm run build

# ========== RUNTIME IMAGE ==========
FROM node:20.14.0 AS runtime
WORKDIR /app

# 3) only bring in production artifacts
COPY --from=builder /app/build ./build
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules

ENV NODE_ENV=production
CMD ["npm","run","start"]
