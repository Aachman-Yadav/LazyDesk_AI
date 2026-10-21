"""
LazyDesk AI - AI Service
Handles all communication with the local Ollama inference runtime.

Security notes:
- Model output is NEVER trusted directly; it is validated by Pydantic schemas.
- No shell commands are ever constructed from model output.
- No filesystem paths are derived from model output.
- Notes are not logged to protect user privacy.
"""
from __future__ import annotations

import json
import logging
import re
import uuid
from datetime import datetime, timedelta
from typing import Any

import httpx

from app.config import Settings
from app.schemas import OrganizeResponse, TaskItem

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Relative deadline resolution helpers
# ---------------------------------------------------------------------------

RELATIVE_PATTERNS: list[tuple[re.Pattern, int]] = [
    (re.compile(r"\btoday\b", re.IGNORECASE), 0),
    (re.compile(r"\btomorrow\b", re.IGNORECASE), 1),
    (re.compile(r"\bday after tomorrow\b", re.IGNORECASE), 2),
    (re.compile(r"\bthis week(?:end)?\b", re.IGNORECASE), 5),
    (re.compile(r"\bnext week\b", re.IGNORECASE), 7),
    (re.compile(r"\bnext month\b", re.IGNORECASE), 30),
]

WEEKDAY_MAP = {
    "monday": 0, "tuesday": 1, "wednesday": 2, "thursday": 3,
    "friday": 4, "saturday": 5, "sunday": 6,
}


def resolve_relative_deadline(text: str, reference_date: datetime) -> tuple[str | None, bool]:
    """
    Attempt to turn a relative deadline phrase into an ISO date.
    Returns (iso_date_string_or_None, is_uncertain).
    """
    today = reference_date.date()

    for pattern, offset in RELATIVE_PATTERNS:
        if pattern.search(text):
            return str(today + timedelta(days=offset)), False

    # Named weekdays: "next Thursday", "this Friday", "by Thursday"
    for day_name, day_num in WEEKDAY_MAP.items():
        if re.search(rf"\b{day_name}\b", text, re.IGNORECASE):
            days_ahead = (day_num - today.weekday()) % 7
            if days_ahead == 0:
                days_ahead = 7  # "Thursday" means *next* Thursday if today is Thursday
            resolved = str(today + timedelta(days=days_ahead))
            return resolved, False

    return None, True  # could not resolve — mark as uncertain


# ---------------------------------------------------------------------------
# Prompt construction
# ---------------------------------------------------------------------------

def _build_prompt(notes: str, reference_date: datetime, timezone_name: str) -> str:
    today_str = reference_date.strftime("%A, %B %d, %Y")
    return f"""You are a task extraction assistant. Your ONLY job is to parse unstructured notes and return a JSON object.

Today is {today_str} (timezone: {timezone_name}).

USER NOTES:
{notes}

Extract all tasks from the notes and return ONLY valid JSON matching this exact schema — no markdown, no code fences, no explanation:

{{
  "summary": "A 1-2 sentence overview of the user's immediate priorities.",
  "tasks": [
    {{
      "id": "unique-uuid-string",
      "title": "Short task title (max 80 chars)",
      "description": "More detail if available, else empty string",
      "priority": "high|medium|low",
      "category": "Work|College|Personal|Health|Finance|Shopping|Social|Other",
      "deadline": "YYYY-MM-DD or null",
      "deadline_uncertain": false,
      "completed": false
    }}
  ]
}}

Priority rules:
- high: urgent, due soon (today/tomorrow), or explicitly marked important
- medium: due within a week or moderately important
- low: someday, vague, or low-stakes

Deadline rules:
- If the deadline is explicit (e.g. "by Thursday", "this weekend"), resolve it relative to today ({today_str}) and set deadline_uncertain to false.
- If the deadline is very vague (e.g. "someday", "eventually"), set deadline to null and deadline_uncertain to true.
- If no deadline is mentioned, set deadline to null and deadline_uncertain to false.
- NEVER invent a deadline. NEVER guess a specific date without clear textual evidence.

Return ONLY the JSON. Do not include any other text."""


# ---------------------------------------------------------------------------
# Demo mode sample response
# ---------------------------------------------------------------------------

DEMO_RESPONSE = {
    "summary": "DEMO MODE: This is a sample response. Ollama is not running. Install Ollama and pull a model to use real AI inference.",
    "tasks": [
        {
            "id": str(uuid.uuid4()),
            "title": "Install Ollama",
            "description": "Download and install from https://ollama.com/download",
            "priority": "high",
            "category": "Work",
            "deadline": None,
            "deadline_uncertain": False,
            "completed": False,
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Pull the AI model",
            "description": "Run: ollama pull llama3.2",
            "priority": "high",
            "category": "Work",
            "deadline": None,
            "deadline_uncertain": False,
            "completed": False,
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Start the Ollama service",
            "description": "Run: ollama serve (or it starts automatically on most systems)",
            "priority": "medium",
            "category": "Work",
            "deadline": None,
            "deadline_uncertain": False,
            "completed": False,
        },
    ],
}


# ---------------------------------------------------------------------------
# AI Service class
# ---------------------------------------------------------------------------

class AIService:
    """Manages communication with the Ollama local inference runtime."""

    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self._client: httpx.AsyncClient | None = None

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                base_url=self.settings.ollama_base_url,
                timeout=httpx.Timeout(self.settings.ollama_timeout),
            )
        return self._client

    async def close(self) -> None:
        if self._client and not self._client.is_closed:
            await self._client.aclose()

    async def health_check(self) -> bool:
        """Check if Ollama is reachable. Returns True if reachable."""
        try:
            client = await self._get_client()
            resp = await client.get("/api/tags", timeout=5.0)
            return resp.status_code == 200
        except Exception:
            return False

    async def list_models(self) -> list[str]:
        """Return names of locally available models."""
        client = await self._get_client()
        resp = await client.get("/api/tags", timeout=5.0)
        resp.raise_for_status()
        data = resp.json()
        return [m["name"] for m in data.get("models", [])]

    async def organize_tasks(self, notes: str) -> OrganizeResponse:
        """
        Send notes to Ollama and return a validated OrganizeResponse.
        Retries up to settings.max_retries times on malformed output.
        """
        if self.settings.demo_mode:
            logger.info("Demo mode active — returning sample response.")
            return _build_demo_response(self.settings.ollama_model)

        now = datetime.now(self.settings.timezone)
        prompt = _build_prompt(notes, now, self.settings.local_timezone)

        last_error: Exception | None = None
        raw_text: str = ""

        for attempt in range(self.settings.max_retries + 1):
            try:
                raw_text = await self._call_ollama(prompt)
                response = _parse_and_validate(raw_text, now, self.settings.ollama_model)
                return response
            except (json.JSONDecodeError, ValueError, KeyError) as exc:
                last_error = exc
                logger.warning(
                    "Attempt %d/%d: invalid model output — %s",
                    attempt + 1,
                    self.settings.max_retries + 1,
                    str(exc),
                )
                if attempt < self.settings.max_retries:
                    # Add an explicit JSON reminder to the prompt on retry
                    prompt = prompt + "\n\nIMPORTANT: Return ONLY raw JSON. No markdown. No explanation."

        raise ValueError(
            f"Model returned invalid output after {self.settings.max_retries + 1} attempts. "
            f"Last error: {last_error}. "
            f"Raw text (truncated): {raw_text[:200]!r}"
        )

    async def _call_ollama(self, prompt: str) -> str:
        """Send a single generate request to Ollama and return the response text."""
        client = await self._get_client()
        payload: dict[str, Any] = {
            "model": self.settings.ollama_model,
            "prompt": prompt,
            "stream": False,
            "format": "json",
            "options": {
                "temperature": 0.1,  # low temperature for deterministic, structured output
                "num_predict": 2048,
            },
        }
        try:
            resp = await client.post("/api/generate", json=payload)
        except httpx.ConnectError as exc:
            raise ConnectionError(
                f"Cannot connect to Ollama at {self.settings.ollama_base_url}. "
                "Is Ollama running? Try: ollama serve"
            ) from exc
        except httpx.TimeoutException as exc:
            raise TimeoutError(
                f"Ollama request timed out after {self.settings.ollama_timeout}s. "
                "Try a smaller model or increase OLLAMA_TIMEOUT."
            ) from exc

        if resp.status_code == 404:
            raise ValueError(
                f"Model '{self.settings.ollama_model}' not found on Ollama. "
                f"Pull it with: ollama pull {self.settings.ollama_model}"
            )
        if resp.status_code != 200:
            raise ValueError(f"Ollama returned HTTP {resp.status_code}: {resp.text[:200]}")

        data = resp.json()
        return data.get("response", "")


# ---------------------------------------------------------------------------
# Parsing helpers
# ---------------------------------------------------------------------------

def _extract_json(text: str) -> str:
    """
    Try to extract a JSON object from model output that may contain
    markdown fences, preamble, or trailing text.
    """
    # Strip markdown fences
    text = re.sub(r"```(?:json)?\s*", "", text).strip()

    # Try to find the outermost JSON object
    start = text.find("{")
    if start == -1:
        raise json.JSONDecodeError("No JSON object found in model output", text, 0)

    # Find matching closing brace
    depth = 0
    for i, ch in enumerate(text[start:], start):
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                return text[start : i + 1]

    raise json.JSONDecodeError("Unmatched braces in model output", text, start)


def _parse_and_validate(raw: str, reference_date: datetime, model_name: str) -> OrganizeResponse:
    """Parse raw model output and return a validated OrganizeResponse."""
    json_str = _extract_json(raw)
    data: dict = json.loads(json_str)

    # Validate required top-level keys
    if "tasks" not in data:
        raise KeyError("Model response missing 'tasks' field.")
    if "summary" not in data or not str(data.get("summary", "")).strip():
        data["summary"] = "Tasks extracted from your notes."

    # Post-process tasks: resolve relative deadlines not caught by the model
    validated_tasks: list[TaskItem] = []
    for raw_task in data.get("tasks", []):
        if not isinstance(raw_task, dict):
            continue
        # Let Pydantic validate the task
        task = TaskItem.model_validate(raw_task)
        validated_tasks.append(task)

    return OrganizeResponse(
        summary=str(data["summary"]),
        tasks=validated_tasks,
        model_used=model_name,
        processed_at=reference_date.isoformat(),
    )


def _build_demo_response(model_name: str) -> OrganizeResponse:
    """Build a clearly-labeled demo response."""
    tasks = [TaskItem.model_validate(t) for t in DEMO_RESPONSE["tasks"]]
    return OrganizeResponse(
        summary=DEMO_RESPONSE["summary"],
        tasks=tasks,
        model_used="DEMO (no real model)",
        processed_at=datetime.now().isoformat(),
    )
