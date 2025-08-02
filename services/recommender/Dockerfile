FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt requirements.txt
RUN pip install -r requirements.txt

RUN --mount=type=secret,id=gcs_bucket_name \
    --mount=type=secret,id=hnsw_index_blob \
    --mount=type=secret,id=recipe_ids_blob \
    export GCS_BUCKET_NAME="$(cat /run/secrets/gcs_bucket_name)" \
    && export HNSW_INDEX_BLOB="$(cat /run/secrets/hnsw_index_blob)" \
    && export RECIPE_IDS_BLOB="$(cat /run/secrets/recipe_ids_blob)"

COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]