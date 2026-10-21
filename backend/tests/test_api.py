"""
LazyDesk AI - Backend Tests: API Endpoints
Tests cover health, models, organize endpoints, and all major error paths.
The AI service is mocked — no running Ollama is required.
"""
from __future__ import annotations

import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from fastapi.testclient import TestClient

from app.main import app
from app.schemas import OrganizeResponse, TaskItem


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture()
def client():
    """Return a synchronous test client for the FastAPI app."""
    with TestClient(app, raise_server_exceptions=False) as c:
        yield c


def _make_task(**kwargs) -> TaskItem:
    defaults = {
        "id": "abc123",
        "title": "Test Task",
        "description": "A test task description",
        "priority": "medium",
        "category": "Work",
        "deadline": None,
        "deadline_uncertain": False,
        "completed": False,
    }
    defaults.update(kwargs)
    return TaskItem.model_validate(defaults)


def _make_response(**kwargs) -> OrganizeResponse:
    defaults = {
        "summary": "You have one task to complete.",
        "tasks": [_make_task()],
        "model_used": "llama3.2",
        "processed_at": "2026-10-20T14:00:00",
    }
    defaults.update(kwargs)
    return OrganizeResponse.model_validate(defaults)


# ---------------------------------------------------------------------------
# Health endpoint
# ---------------------------------------------------------------------------

class TestHealth:
    def test_health_ollama_reachable(self, client):
        with patch.object(
            app.state, "ai_service", create=True
        ) as mock_svc:
            mock_svc.health_check = AsyncMock(return_value=True)
            app.state.ai_service = mock_svc
            resp = client.get("/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "ok"
        assert data["ollama_reachable"] is True

    def test_health_ollama_unreachable(self, client):
        with patch.object(app.state, "ai_service", create=True) as mock_svc:
            mock_svc.health_check = AsyncMock(return_value=False)
            app.state.ai_service = mock_svc
            resp = client.get("/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "ok"
        assert data["ollama_reachable"] is False


# ---------------------------------------------------------------------------
# Models endpoint
# ---------------------------------------------------------------------------

class TestModels:
    def test_models_reachable(self, client):
        with patch.object(app.state, "ai_service", create=True) as mock_svc:
            mock_svc.list_models = AsyncMock(return_value=["llama3.2", "gemma2:2b"])
            app.state.ai_service = mock_svc
            resp = client.get("/api/models")
        assert resp.status_code == 200
        data = resp.json()
        assert data["ollama_reachable"] is True
        assert "llama3.2" in data["models"]

    def test_models_unreachable(self, client):
        with patch.object(app.state, "ai_service", create=True) as mock_svc:
            mock_svc.list_models = AsyncMock(side_effect=ConnectionError("unreachable"))
            app.state.ai_service = mock_svc
            resp = client.get("/api/models")
        assert resp.status_code == 200
        data = resp.json()
        assert data["ollama_reachable"] is False
        assert data["models"] == []
        assert data["error"] is not None


# ---------------------------------------------------------------------------
# Organize endpoint - happy path
# ---------------------------------------------------------------------------

class TestOrganize:
    def test_successful_organization(self, client):
        mock_response = _make_response()
        with patch.object(app.state, "ai_service", create=True) as mock_svc:
            mock_svc.organize_tasks = AsyncMock(return_value=mock_response)
            app.state.ai_service = mock_svc
            resp = client.post(
                "/api/organize",
                json={"notes": "Finish DBMS assignment by Thursday and buy groceries this weekend."},
            )
        assert resp.status_code == 200
        data = resp.json()
        assert "summary" in data
        assert "tasks" in data
        assert isinstance(data["tasks"], list)
        assert len(data["tasks"]) >= 1

    def test_multiple_tasks_returned(self, client):
        tasks = [
            _make_task(id="1", title="Task A", priority="high"),
            _make_task(id="2", title="Task B", priority="low"),
        ]
        mock_response = _make_response(tasks=tasks, summary="Two tasks.")
        with patch.object(app.state, "ai_service", create=True) as mock_svc:
            mock_svc.organize_tasks = AsyncMock(return_value=mock_response)
            app.state.ai_service = mock_svc
            resp = client.post(
                "/api/organize",
                json={"notes": "Task A is urgent. Task B can wait."},
            )
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["tasks"]) == 2


# ---------------------------------------------------------------------------
# Input validation
# ---------------------------------------------------------------------------

class TestInputValidation:
    def test_empty_notes_rejected(self, client):
        resp = client.post("/api/organize", json={"notes": ""})
        assert resp.status_code == 422

    def test_whitespace_only_notes_rejected(self, client):
        resp = client.post("/api/organize", json={"notes": "   "})
        assert resp.status_code == 422

    def test_too_short_notes_rejected(self, client):
        with patch.object(app.state, "ai_service", create=True) as mock_svc:
            mock_svc.organize_tasks = AsyncMock(return_value=_make_response())
            app.state.ai_service = mock_svc
            resp = client.post("/api/organize", json={"notes": "hi"})
        # "hi" is 2 chars, below min of 10
        assert resp.status_code == 422

    def test_oversized_notes_rejected(self, client):
        long_notes = "a" * 6000
        with patch.object(app.state, "ai_service", create=True) as mock_svc:
            mock_svc.organize_tasks = AsyncMock(return_value=_make_response())
            app.state.ai_service = mock_svc
            resp = client.post("/api/organize", json={"notes": long_notes})
        assert resp.status_code == 422

    def test_missing_notes_field_rejected(self, client):
        resp = client.post("/api/organize", json={})
        assert resp.status_code == 422


# ---------------------------------------------------------------------------
# Error handling
# ---------------------------------------------------------------------------

class TestErrorHandling:
    def test_ollama_unavailable(self, client):
        with patch.object(app.state, "ai_service", create=True) as mock_svc:
            mock_svc.organize_tasks = AsyncMock(
                side_effect=ConnectionError("Cannot connect to Ollama")
            )
            app.state.ai_service = mock_svc
            resp = client.post(
                "/api/organize",
                json={"notes": "Finish my assignment by tomorrow morning."},
            )
        assert resp.status_code == 503
        data = resp.json()
        assert data["detail"]["error"] == "ollama_unavailable"

    def test_ollama_timeout(self, client):
        with patch.object(app.state, "ai_service", create=True) as mock_svc:
            mock_svc.organize_tasks = AsyncMock(
                side_effect=TimeoutError("Request timed out")
            )
            app.state.ai_service = mock_svc
            resp = client.post(
                "/api/organize",
                json={"notes": "Revise for the exam tomorrow night please."},
            )
        assert resp.status_code == 504
        data = resp.json()
        assert data["detail"]["error"] == "ollama_timeout"

    def test_model_not_found(self, client):
        with patch.object(app.state, "ai_service", create=True) as mock_svc:
            mock_svc.organize_tasks = AsyncMock(
                side_effect=ValueError("Model 'xyz' not found on Ollama.")
            )
            app.state.ai_service = mock_svc
            resp = client.post(
                "/api/organize",
                json={"notes": "Schedule a team meeting for next week."},
            )
        assert resp.status_code == 404
        data = resp.json()
        assert data["detail"]["error"] == "model_not_found"

    def test_invalid_model_output(self, client):
        with patch.object(app.state, "ai_service", create=True) as mock_svc:
            mock_svc.organize_tasks = AsyncMock(
                side_effect=ValueError("Model returned invalid output after 3 attempts.")
            )
            app.state.ai_service = mock_svc
            resp = client.post(
                "/api/organize",
                json={"notes": "Do my laundry and prepare presentation slides."},
            )
        assert resp.status_code == 422
        data = resp.json()
        assert data["detail"]["error"] == "invalid_model_output"
