from __future__ import annotations

import io
import os
import threading
from contextlib import asynccontextmanager
from typing import Annotated, Any

from fastapi import FastAPI, File, Header, HTTPException, UploadFile
from fastapi.concurrency import run_in_threadpool
from PIL import Image, ImageOps, UnidentifiedImageError
from pydantic import BaseModel

MODEL_ID = os.getenv(
    "AI_CHECKER_MODEL_ID", "dima806/ai_vs_real_image_detection"
)
SHARED_SECRET = os.getenv(
    "AI_CHECKER_SHARED_SECRET", "protocol36-local-ai-checker"
)
MAX_IMAGE_BYTES = 20 * 1024 * 1024
MAX_IMAGE_PIXELS = 40_000_000
LIKELY_AI_THRESHOLD = float(os.getenv("AI_CHECKER_AI_THRESHOLD", "0.85"))
LIKELY_REAL_THRESHOLD = float(os.getenv("AI_CHECKER_REAL_THRESHOLD", "0.85"))

_classifier: Any | None = None
_model_error: str | None = None
_model_lock = threading.Lock()


class AnalysisResponse(BaseModel):
    status: str
    ai_probability: float
    real_probability: float
    model_id: str
    review_required: bool


def classify_scores(
    predictions: list[dict[str, Any]],
) -> tuple[str, float, float]:
    ai_probability = 0.0
    real_probability = 0.0

    for prediction in predictions:
        label = str(prediction.get("label", "")).strip().lower()
        score = float(prediction.get("score", 0.0))
        if any(token in label for token in ("fake", "ai", "artificial")):
            ai_probability = max(ai_probability, score)
        elif any(token in label for token in ("real", "human")):
            real_probability = max(real_probability, score)

    if ai_probability >= LIKELY_AI_THRESHOLD:
        status = "likely_ai"
    elif real_probability >= LIKELY_REAL_THRESHOLD:
        status = "likely_real"
    else:
        status = "inconclusive"

    return status, ai_probability, real_probability


def load_classifier() -> Any:
    global _classifier, _model_error
    if _classifier is not None:
        return _classifier

    with _model_lock:
        if _classifier is not None:
            return _classifier
        try:
            from transformers import pipeline

            _classifier = pipeline(
                "image-classification",
                model=MODEL_ID,
                device=-1,
                trust_remote_code=False,
                model_kwargs={"use_safetensors": True},
            )
            _model_error = None
            return _classifier
        except Exception as error:
            _model_error = str(error)
            raise


def decode_image(contents: bytes) -> Image.Image:
    try:
        image = Image.open(io.BytesIO(contents))
        if image.width * image.height > MAX_IMAGE_PIXELS:
            raise ValueError("Image dimensions exceed the safety limit")
        return ImageOps.exif_transpose(image).convert("RGB")
    except (UnidentifiedImageError, OSError, ValueError) as error:
        raise HTTPException(status_code=415, detail="Invalid image file") from error


def run_analysis(image: Image.Image) -> AnalysisResponse:
    try:
        classifier = load_classifier()
        predictions = classifier(image, top_k=None)
    except Exception as error:
        raise HTTPException(
            status_code=503, detail="AI model is unavailable"
        ) from error

    status, ai_probability, real_probability = classify_scores(predictions)
    return AnalysisResponse(
        status=status,
        ai_probability=round(ai_probability, 6),
        real_probability=round(real_probability, 6),
        model_id=MODEL_ID,
        review_required=status != "likely_real",
    )


@asynccontextmanager
async def lifespan(_: FastAPI):
    if os.getenv("AI_CHECKER_PRELOAD", "0") == "1":
        await run_in_threadpool(load_classifier)
    yield


app = FastAPI(
    title="PROTOCOL36 AI Image Risk Checker",
    docs_url=None,
    redoc_url=None,
    lifespan=lifespan,
)


@app.get("/health")
async def health() -> dict[str, Any]:
    return {
        "ok": True,
        "model_id": MODEL_ID,
        "model_loaded": _classifier is not None,
        "model_error": bool(_model_error),
    }


@app.post("/analyze", response_model=AnalysisResponse)
async def analyze(
    file: Annotated[UploadFile, File(description="Image evidence")],
    x_ai_checker_key: Annotated[str | None, Header()] = None,
) -> AnalysisResponse:
    if not SHARED_SECRET or x_ai_checker_key != SHARED_SECRET:
        raise HTTPException(status_code=401, detail="Invalid service credential")
    if file.content_type not in {"image/jpeg", "image/png", "image/webp"}:
        raise HTTPException(status_code=415, detail="Unsupported image type")

    contents = await file.read(MAX_IMAGE_BYTES + 1)
    await file.close()
    if not contents:
        raise HTTPException(status_code=400, detail="Empty image")
    if len(contents) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=413, detail="Image exceeds 20MB")

    image = await run_in_threadpool(decode_image, contents)
    try:
        return await run_in_threadpool(run_analysis, image)
    finally:
        image.close()
