"""
LazyDesk AI - Backend Tests: Schema Validation
Tests for Pydantic schema validation, edge cases, and data sanitization.
"""
from __future__ import annotations

import uuid
from datetime import datetime

import pytest

from app.schemas import (
    ModelsResponse,
    OrganizeRequest,
    OrganizeResponse,
    TaskItem,
)
from app.ai_service import _extract_json, _parse_and_validate


# ---------------------------------------------------------------------------
# TaskItem validation
# ---------------------------------------------------------------------------

class TestTaskItem:
    def test_valid_task(self):
        task = TaskItem.model_validate({
            "title": "Finish assignment",
            "priority": "high",
            "category": "College",
            "deadline": "2026-10-23",
            "completed": False,
        })
        assert task.title == "Finish assignment"
        assert task.priority == "high"
        assert task.category == "College"
        assert uuid.UUID(task.id)  # valid UUID

    def test_id_generated_when_missing(self):
        task = TaskItem.model_validate({"title": "Task without ID"})
        assert task.id
        assert uuid.UUID(task.id)

    def test_invalid_deadline_discarded(self):
        task = TaskItem.model_validate({
            "title": "Task with bad deadline",
            "deadline": "not-a-date",
        })
        assert task.deadline is None

    def test_null_string_deadline_discarded(self):
        for v in ("null", "none", "n/a", "unknown", ""):
            task = TaskItem.model_validate({"title": "Task", "deadline": v})
            assert task.deadline is None, f"Expected None for deadline '{v}'"

    def test_valid_iso_deadline_kept(self):
        task = TaskItem.model_validate({
            "title": "Task",
            "deadline": "2026-10-25",
        })
        assert task.deadline == "2026-10-25"

    def test_priority_aliases_normalized(self):
        for alias, expected in [
            ("urgent", "high"),
            ("important", "high"),
            ("normal", "medium"),
            ("minor", "low"),
        ]:
            task = TaskItem.model_validate({"title": "T", "priority": alias})
            assert task.priority == expected, f"priority alias '{alias}' → expected '{expected}'"

    def test_unknown_priority_defaults_to_medium(self):
        task = TaskItem.model_validate({"title": "T", "priority": "weird_value"})
        assert task.priority == "medium"

    def test_category_normalized_to_title_case(self):
        task = TaskItem.model_validate({"title": "T", "category": "college"})
        assert task.category == "College"

    def test_unknown_category_defaults_to_other(self):
        task = TaskItem.model_validate({"title": "T", "category": "Hobby"})
        assert task.category == "Other"

    def test_title_whitespace_collapsed(self):
        task = TaskItem.model_validate({"title": "  Finish   my  assignment  "})
        assert task.title == "Finish my assignment"


# ---------------------------------------------------------------------------
# OrganizeResponse validation
# ---------------------------------------------------------------------------

class TestOrganizeResponse:
    def test_duplicate_ids_resolved(self):
        tasks_data = [
            {"id": "same-id", "title": "Task A"},
            {"id": "same-id", "title": "Task B"},
        ]
        resp = OrganizeResponse.model_validate({
            "summary": "Two tasks.",
            "tasks": tasks_data,
        })
        ids = [t.id for t in resp.tasks]
        assert len(set(ids)) == 2, "Duplicate IDs should be regenerated"

    def test_empty_task_list_allowed(self):
        resp = OrganizeResponse.model_validate({
            "summary": "No tasks found.",
            "tasks": [],
        })
        assert resp.tasks == []

    def test_summary_whitespace_collapsed(self):
        resp = OrganizeResponse.model_validate({
            "summary": "  Two   tasks to do.  ",
            "tasks": [],
        })
        assert resp.summary == "Two tasks to do."


# ---------------------------------------------------------------------------
# OrganizeRequest validation
# ---------------------------------------------------------------------------

class TestOrganizeRequest:
    def test_valid_notes(self):
        req = OrganizeRequest(notes="Finish my DBMS assignment by Thursday.")
        assert req.notes.strip()

    def test_empty_notes_rejected(self):
        with pytest.raises(Exception):
            OrganizeRequest(notes="")

    def test_whitespace_only_rejected(self):
        with pytest.raises(Exception):
            OrganizeRequest(notes="   \n\t  ")


# ---------------------------------------------------------------------------
# JSON extraction helper
# ---------------------------------------------------------------------------

class TestExtractJson:
    def test_clean_json(self):
        text = '{"summary": "ok", "tasks": []}'
        assert _extract_json(text) == text

    def test_json_in_markdown_fence(self):
        text = '```json\n{"summary": "ok", "tasks": []}\n```'
        extracted = _extract_json(text)
        assert extracted == '{"summary": "ok", "tasks": []}'

    def test_json_with_preamble(self):
        text = 'Here is the result:\n{"summary": "ok", "tasks": []}\nEnd.'
        extracted = _extract_json(text)
        assert '"summary"' in extracted

    def test_no_json_raises(self):
        import json
        with pytest.raises(json.JSONDecodeError):
            _extract_json("No JSON here at all.")


# ---------------------------------------------------------------------------
# Deadline resolution in parse_and_validate
# ---------------------------------------------------------------------------

class TestDeadlineHandling:
    def test_missing_deadline_stays_null(self):
        raw = '{"summary": "task", "tasks": [{"title": "T", "deadline": null}]}'
        now = datetime(2026, 10, 20, 14, 0, 0)
        resp = _parse_and_validate(raw, now, "test-model")
        assert resp.tasks[0].deadline is None

    def test_valid_deadline_preserved(self):
        raw = '{"summary": "task", "tasks": [{"title": "T", "deadline": "2026-10-23"}]}'
        now = datetime(2026, 10, 20, 14, 0, 0)
        resp = _parse_and_validate(raw, now, "test-model")
        assert resp.tasks[0].deadline == "2026-10-23"

    def test_ambiguous_deadline_set_to_null(self):
        raw = '{"summary": "task", "tasks": [{"title": "T", "deadline": "someday"}]}'
        now = datetime(2026, 10, 20, 14, 0, 0)
        resp = _parse_and_validate(raw, now, "test-model")
        assert resp.tasks[0].deadline is None

    def test_uncertain_deadline_flagged(self):
        raw = '{"summary": "task", "tasks": [{"title": "T", "deadline": null, "deadline_uncertain": true}]}'
        now = datetime(2026, 10, 20, 14, 0, 0)
        resp = _parse_and_validate(raw, now, "test-model")
        assert resp.tasks[0].deadline_uncertain is True
