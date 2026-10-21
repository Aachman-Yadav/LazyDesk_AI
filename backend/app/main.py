"""
LazyDesk AI - FastAPI Application Entry Point
"""
from __future__ import annotations

import logging
import sys

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.ai_service import AIService
from app.config import get_settings
from app.routes import router

# ---------------------------------------------------------------------------
# Logging configuration
# ---------------------------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Application lifecycle
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    settings = get_settings()
    ai_service = AIService(settings)
    app.state.ai_service = ai_service

    logger.info("LazyDesk AI backend starting...")
    logger.info("Ollama URL: %s", settings.ollama_base_url)
    logger.info("Model: %s", settings.ollama_model)
    logger.info("Demo mode: %s", settings.demo_mode)

    reachable = await ai_service.health_check()
    if reachable:
        logger.info("✅ Ollama is reachable.")
    else:
        logger.warning(
            "⚠️  Ollama is NOT reachable at %s. "
            "Start it with: ollama serve",
            settings.ollama_base_url,
        )

    yield

    logger.info("LazyDesk AI backend shutting down...")
    await ai_service.close()


# ---------------------------------------------------------------------------
# FastAPI application
# ---------------------------------------------------------------------------

settings = get_settings()

app = FastAPI(
    title="LazyDesk AI",
    description=(
        "Local-first AI productivity assistant that transforms messy notes "
        "into organized, prioritized tasks using a local Ollama model."
    ),
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS — restrict to the configured frontend origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin, "http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Accept"],
)

# Register routes
app.include_router(router)


# ---------------------------------------------------------------------------
# Global exception handler (safety net)
# ---------------------------------------------------------------------------

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unhandled exception on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={"error": "internal_error", "message": "An unexpected server error occurred."},
    )


# ---------------------------------------------------------------------------
# Dev runner (for direct python main.py invocation)
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn

    s = get_settings()
    uvicorn.run(
        "app.main:app",
        host=s.backend_host,
        port=s.backend_port,
        reload=True,
        log_level="info",
    )
