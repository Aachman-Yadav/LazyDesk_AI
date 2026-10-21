"""
LazyDesk AI - Pydantic Schemas
All data shapes passed between the frontend, backend, and AI service.
The AI model is treated as an untrusted source: every field is validated
before the response is returned to the browser.
"""
from __future__ import annotations

import re
import uuid
from datetime import date, datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field, field_validator, model_validator


# ---------------------------------------------------------------------------
# Allowed priority and category values
# ---------------------------------------------------------------------------

PRIORITY_VALUES = Literal["high", "medium", "low"]
CATEGORY_VALUES = Literal[
    "Work",
    "College",
    "Personal",
    "Health",
    "Finance",
    "Shopping",
    "Social",
    "Other",
]


class TaskItem(BaseModel):
    """A single extracted task, validated after AI inference."""

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str = Field(..., min_length=1, max_length=200)
    description: str = Field(default="", max_length=500)
    priority: PRIORITY_VALUES = "medium"
    category: CATEGORY_VALUES = "Other"
    deadline: Optional[str] = None  # ISO date string "YYYY-MM-DD" or null
    deadline_uncertain: bool = False  # true when deadline was inferred ambiguously
    completed: bool = False

    @field_validator("title")
    @classmethod
    def sanitize_title(cls, v: str) -> str:
        # Strip leading/trailing whitespace; collapse internal whitespace
        return re.sub(r"\s+", " ", v.strip())

    @field_validator("description")
    @classmethod
    def sanitize_description(cls, v: str) -> str:
        return re.sub(r"\s+", " ", v.strip()) if v else ""

    @field_validator("deadline")
    @classmethod
    def validate_deadline(cls, v: Optional[str]) -> Optional[str]:
        if v is None or v == "" or v.lower() in ("null", "none", "n/a", "unknown"):
            return None
        try:
            # Ensure it is a valid ISO date
            date.fromisoformat(v)
            return v
        except ValueError:
            # If the model returned something unparseable, discard it
            return None

    @field_validator("priority", mode="before")
    @classmethod
    def normalize_priority(cls, v: str) -> str:
        mapping = {
            "urgent": "high",
            "important": "high",
            "critical": "high",
            "normal": "medium",
            "moderate": "medium",
            "minor": "low",
            "low priority": "low",
        }
        normalized = str(v).lower().strip()
        return mapping.get(normalized, normalized if normalized in ("high", "medium", "low") else "medium")

    @field_validator("category", mode="before")
    @classmethod
    def normalize_category(cls, v: str) -> str:
        allowed = {"Work", "College", "Personal", "Health", "Finance", "Shopping", "Social", "Other"}
        normalized = str(v).strip().title()
        return normalized if normalized in allowed else "Other"

    @field_validator("id")
    @classmethod
    def validate_id(cls, v: str) -> str:
        # Ensure ID is non-empty; if model gave something weird, generate a fresh one
        v = str(v).strip()
        if not v:
            return str(uuid.uuid4())
        return v


class OrganizeResponse(BaseModel):
    """Validated response returned to the frontend after AI organization."""

    summary: str = Field(..., min_length=1, max_length=1000)
    tasks: list[TaskItem] = Field(default_factory=list)
    model_used: str = ""
    processed_at: str = ""

    @field_validator("summary")
    @classmethod
    def sanitize_summary(cls, v: str) -> str:
        return re.sub(r"\s+", " ", v.strip())

    @model_validator(mode="after")
    def ensure_unique_ids(self) -> "OrganizeResponse":
        seen: set[str] = set()
        for task in self.tasks:
            if task.id in seen:
                task.id = str(uuid.uuid4())
            seen.add(task.id)
        return self


class OrganizeRequest(BaseModel):
    """Request body sent by the frontend."""

    notes: str = Field(..., min_length=1)

    @field_validator("notes")
    @classmethod
    def validate_notes(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("Notes cannot be empty or whitespace only.")
        return stripped


class HealthResponse(BaseModel):
    """Response shape for the /health endpoint."""

    status: str
    backend_version: str = "1.0.0"
    ollama_reachable: bool
    ollama_url: str
    model_configured: str
    demo_mode: bool


class ModelsResponse(BaseModel):
    """Response shape for the /api/models endpoint."""

    ollama_reachable: bool
    models: list[str] = Field(default_factory=list)
    error: Optional[str] = None
