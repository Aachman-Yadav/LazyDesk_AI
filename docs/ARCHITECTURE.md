# LazyDesk AI — Architecture & System Design

## 1. System Overview

LazyDesk AI is a privacy-first, local-inference productivity assistant designed to convert unstructured, messy notes (slack dumps, chat messages, stream-of-consciousness brain dumps) into organized, prioritized, actionable tasks.

The core philosophy is **"Slow and Steady"**—prioritizing reliability, data privacy, predictable schema validation, and zero cloud lock-in over speculative cloud agent loops.

```
+-----------------------------------------------------------------------+
|                           CLIENT (BROWSER)                            |
|                                                                       |
|   React 18 + Vite SPA                                                 |
|   - NotesInput (pre-fill presets, validation, character budget)       |
|   - TaskList (cards, completion state, inline editing, copy export)   |
|   - AIStatus (live health poll against Ollama runtime)                |
|   - LocalStorage persistence (workspace state saved locally)          |
+------------------------------------+----------------------------------+
                                     |
                                     | HTTP / JSON (CORS protected)
                                     v
+------------------------------------+----------------------------------+
|                           FASTAPI BACKEND                             |
|                                                                       |
|   - REST API Routes (/api/health, /api/models, /api/organize)         |
|   - Input Sanitization & Boundary Checks (10 to 5000 chars)           |
|   - Timezone Context Injection (relative dates -> calendar dates)     |
|   - Pydantic v2 Schema Enforcement & Self-Healing Parser              |
|   - Error Classifier (Timeout, Connection, Missing Model, Schema)     |
+------------------------------------+----------------------------------+
                                     |
                                     | HTTP REST (Ollama API: 11434)
                                     v
+-----------------------------------------------------------------------+
|                    LOCAL OPEN-WEIGHT AI RUNTIME                       |
|                                                                       |
|   Ollama Runtime                                                      |
|   - Model: Llama 3.2 (3B parameters) or Gemma 2 (2B)                  |
|   - JSON Mode constrained decoding (`format: "json"`)                 |
|   - Zero data leaves localhost — 100% telemetry-free & private        |
+-----------------------------------------------------------------------+
```

---

## 2. Component Architecture

### 2.1 Backend Service (`backend/app/`)
* **`main.py`**: FastAPI application entrypoint. Configures strict CORS middleware, lifespan event handlers, routing, and unhandled exception logging.
* **`config.py`**: Pydantic `BaseSettings` object reading from `.env` or system environment variables. Supports `DEMO_MODE` for automated testing/evaluators when GPU/Ollama is absent.
* **`schemas.py`**: Strong data contracts.
  * `OrganizeRequest`: Enforces minimum length (10 chars), maximum length (5000 chars), whitespace trimming.
  * `TaskItem`: Auto-generates UUIDs, normalizes priority (`high`, `medium`, `low`), categorizes into predefined taxonomies, validates ISO-8601 deadlines, and flags ambiguous dates.
  * `OrganizeResponse`: Summary string, list of `TaskItem`s, model identifier, and server timestamp.
* **`ai_service.py`**:
  * Constructs context-rich system prompts containing local weekday, date, and timezone.
  * Communicates via `httpx.AsyncClient` with Ollama's `/api/generate`.
  * Implements `_extract_json` to resiliently extract JSON even if enclosed in markdown backticks or preceded by conversational preamble.
  * Automatic retry loop with JSON reminder prompt if parsing encounters malformed syntax.
* **`routes.py`**:
  * `GET /api/health`: Validates backend uptime and queries Ollama connectivity.
  * `GET /api/models`: Returns available models installed on the local Ollama instance.
  * `POST /api/organize`: Validates input notes, runs AI extraction, and returns structured task lists.

### 2.2 Frontend Application (`frontend/src/`)
* **State Management**:
  * Local workspace persistence via browser `localStorage` under `lazydesk_tasks` and `lazydesk_summary`.
  * Optimistic UI updates when toggling task completion, editing inline titles/deadlines, or deleting tasks.
* **Design System**:
  * Vanilla CSS variables (`--color-bg`, `--color-surface`, `--color-primary`, `--color-accent`) creating an ultra-modern dark glassmorphism aesthetic.
  * Zero external network dependencies (system font stacks prevent CDN blocking/timeouts).
  * Accessible ARIA attributes (`aria-pressed`, `aria-label`, semantic landmarks).
* **Defensive Resilience**:
  * `AIStatus` polls every 30 seconds to alert the user if Ollama goes offline or if model inference is ready.
  * Copy-to-clipboard feature with fallback for insecure or non-navigator contexts.

---

## 3. Data Flow & Transformation Pipeline

1. **User Submission**: User pastes messy text (e.g., meeting transcripts, unorganized emails) into `NotesInput`.
2. **Pre-flight Validation**: Input length is checked client-side and sent via `POST /api/organize`.
3. **Temporal Normalization**:
   * The backend determines the current calendar date in the user's configured timezone (e.g., `Asia/Kolkata` or `UTC`).
   * The prompt explicitly defines today's date so the model can resolve relative terms ("tomorrow", "by Thursday", "next week") into absolute ISO dates `YYYY-MM-DD`.
4. **Constrained Inference**:
   * Ollama receives the structured prompt with `format: "json"`.
   * Temperature is clamped to `0.1` for maximum determinism and zero hallucinated schema deviations.
5. **Schema Validation & Healing**:
   * Output passes through `_extract_json()` which strips unwanted markdown wrappers.
   * `Pydantic` validates fields, handles missing keys gracefully, sanitizes priority casing, and resolves relative dates that the model left as conversational strings.
6. **Delivery & Presentation**: The structured response is rendered into categorized task cards with urgency badges, countdowns, and inline editing.

---

## 4. Security & Privacy Posture

* **Air-Gapped Operation**: Neither the notes nor the generated tasks are ever transmitted to third-party cloud APIs (OpenAI, Anthropic, or telemetry trackers).
* **No Unsanitized Execution**: Model outputs are parsed strictly into strongly-typed Pydantic primitives. No model strings are ever evaluated in `eval()`, passed into system shells, or used directly in file paths.
* **CORS Lockdown**: Backend only accepts requests from the designated frontend host.
