FROM node:20.14.0
WORKDIR /app

COPY package*.json ./
RUN npm ci

RUN npx playwright install --with-deps

COPY . .

RUN --mount=type=secret,id=jwt \
    --mount=type=secret,id=dburl \
    --mount=type=secret,id=rapidapi_key_2 \
    export JWT_SECRET="$(cat /run/secrets/jwt)" \
    && export DATABASE_URL="$(cat /run/secrets/dburl)" \
    && export RAPIDAPI_KEY_2="$(cat /run/secrets/rapidapi_key_2)" \
    && npm run build

CMD ["node","build"]
