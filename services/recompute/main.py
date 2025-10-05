from fastapi import FastAPI, HTTPException, Request

app = FastAPI()

@app.get("/health")
def health():
    return {"status": "ok"}