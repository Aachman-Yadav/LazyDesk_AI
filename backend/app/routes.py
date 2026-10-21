"""
LazyDesk AI - API Routes
All FastAPI route handlers. Validation, error handling, and response shaping live here.
"""
from __future__ import annotations

import logging
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import JSONResponse

from app.ai_service import AIService
from app.config import Settings, get_settings
from app.schemas import (
    HealthResponse,
    ModelsResponse,
    OrganizeRequest,
    OrganizeResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter()


# ---------------------------------------------------------------------------
# Dependency helpers
# ---------------------------------------------------------------------------

def get_ai_service(request: Request) -> AIService:
    return request.app.state.ai_service


def get_cfg(settings: Settings = Depends(get_settings)) -> Settings:
    return settings


# ---------------------------------------------------------------------------
# GET /health
# ---------------------------------------------------------------------------

@router.get("/health", response_model=HealthResponse, tags=["System"])
@router.get("/api/health", response_model=HealthResponse, tags=["System"])
async def health(
    ai_service: AIService = Depends(get_ai_service),
    settings: Settings = Depends(get_cfg),
) -> HealthResponse:
    """
    Returns backend health status and Ollama reachability.
    Distinguishes backend availability from model readiness.
    """
    ollama_reachable = await ai_service.health_check()
    return HealthResponse(
        status="ok",
        ollama_reachable=ollama_reachable,
        ollama_url=settings.ollama_base_url,
        model_configured=settings.ollama_model,
        demo_mode=settings.demo_mode,
    )


# ---------------------------------------------------------------------------
# GET /api/models
# ---------------------------------------------------------------------------

@router.get("/api/models", response_model=ModelsResponse, tags=["Models"])
async def list_models(
    ai_service: AIService = Depends(get_ai_service),
) -> ModelsResponse:
    """
    Returns locally available Ollama models.
    Handles an unavailable Ollama service gracefully.
    """
    try:
        models = await ai_service.list_models()
        return ModelsResponse(ollama_reachable=True, models=models)
    except Exception as exc:
        logger.warning("Could not list Ollama models: %s", str(exc))
        return ModelsResponse(
            ollama_reachable=False,
            models=[],
            error=str(exc),
        )


# ---------------------------------------------------------------------------
# POST /api/organize
# ---------------------------------------------------------------------------

@router.post("/api/organize", response_model=OrganizeResponse, tags=["Tasks"])
async def organize_tasks(
    body: OrganizeRequest,
    ai_service: AIService = Depends(get_ai_service),
    settings: Settings = Depends(get_cfg),
) -> OrganizeResponse:
    """
    Accepts user notes, sends them to the local Ollama model,
    validates the response, and returns structured tasks.

    Privacy: user notes are NOT logged.
    """
    # Input length guard
    if len(body.notes) < settings.min_notes_length:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Notes must be at least {settings.min_notes_length} characters.",
        )
    if len(body.notes) > settings.max_notes_length:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Notes exceed the maximum length of {settings.max_notes_length} characters.",
        )

    # Log the request without including the actual notes content
    logger.info(
        "Organize request received — notes length: %d chars, model: %s",
        len(body.notes),
        settings.ollama_model,
    )

    try:
        result = await ai_service.organize_tasks(body.notes)
        logger.info("Organize request completed — %d tasks extracted.", len(result.tasks))
        return result

    except ConnectionError as exc:
        logger.error("Ollama connection error: %s", str(exc))
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "error": "ollama_unavailable",
                "message": str(exc),
                "help": (
                    "Make sure Ollama is running. "
                    "Start it with: ollama serve\n"
                    f"Then pull the model: ollama pull {settings.ollama_model}"
                ),
            },
        )

    except TimeoutError as exc:
        logger.error("Ollama timeout: %s", str(exc))
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail={
                "error": "ollama_timeout",
                "message": str(exc),
                "help": "Try a smaller model or increase OLLAMA_TIMEOUT in .env.",
            },
        )

    except ValueError as exc:
        err_msg = str(exc)
        if "not found" in err_msg.lower():
            logger.error("Model not found: %s", err_msg)
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={
                    "error": "model_not_found",
                    "message": err_msg,
                    "help": f"Pull the model: ollama pull {settings.ollama_model}",
                },
            )
        logger.error("AI service error: %s", err_msg)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error": "invalid_model_output",
                "message": "The AI model returned output that could not be parsed.",
                "help": "Try again. If the problem persists, try a different model.",
            },
        )

    except Exception as exc:
        logger.exception("Unexpected error in organize_tasks.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": "internal_error",
                "message": "An unexpected error occurred.",
            },
        )
