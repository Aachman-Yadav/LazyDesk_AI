# LazyDesk AI 🐢

> **Local-First, Privacy-Preserving AI Task Organizer**  
> Built for the **Hacktoberfest Open-Source AI Challenge: Week 3 (October 19–25, 2026)**  
> **Theme**: *Slow and Steady*

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18+-61DAFB.svg?logo=react&logoColor=black)](https://react.dev)
[![Ollama](https://img.shields.io/badge/Ollama-Local_Inference-white.svg?logo=ollama&logoColor=black)](https://ollama.com)
[![Tests: 39 Passed](https://img.shields.io/badge/Tests-39%20Passed-brightgreen.svg)]()

---

## 📌 Overview

**LazyDesk AI** solves the everyday problem of the "messy brain dump": scattered thoughts, meeting action items, chat snippets, and unformatted reminders. Instead of requiring you to manually click and fill in task titles, categories, priorities, and deadlines, LazyDesk AI takes your unstructured notes and uses an **open-weight language model running locally on your machine** to automatically extract, categorize, and prioritize your work.

### Why "Slow and Steady"?
In an era where tech products prioritize brittle cloud agents and unmetered token burn, LazyDesk AI embraces the **Slow and Steady** ethos:
- **100% Local Inference**: Zero data leaves your machine. Your personal notes are never used for training or sent over the wire.
- **Deterministic Guardrails**: LLMs extract natural language; strict Pydantic v2 schemas enforce structure.
- **Zero Cloud Subscriptions**: Runs on your existing CPU/GPU with open weights (`llama3.2`, `gemma2`).
- **Offline Durability**: Works seamlessly on an airplane or without an internet connection.

---

## ✨ Features

- 🧠 **Local Open-Weight AI**: Powered by Meta's **Llama 3.2 (3B)** or Google's **Gemma 2 (2B)** via Ollama.
- 📅 **Relative Deadline Resolution**: Automatically transforms phrases like *"submit report tomorrow"* or *"exam by Thursday"* into ISO calendar dates based on your local timezone.
- 🏷️ **Smart Categorization & Prioritization**: Organizes tasks into `Work`, `College`, `Personal`, `Health`, `Finance`, `Shopping`, `Social`, and assigns `high`, `medium`, or `low` priority.
- ⚡ **Interactive Task Management**: Inline title and deadline editing, custom completion checkboxes, priority filtering, and single-click markdown export to your clipboard.
- 💾 **Local Workspace Persistence**: State is saved automatically in your browser's `localStorage`.
- 🛡️ **Defensive Schema Validation**: Self-healing JSON extraction with automated retry handling if model output contains unexpected markdown fences or chatter.
- 🎨 **Modern Dark Glassmorphism UI**: Handcrafted Vanilla CSS design tokens with full accessibility (ARIA landmarks, screen-reader labels).

---

## 🏗️ System Architecture

```
+─────────────────────────────────────────────────────────────+
│                       REACT FRONTEND                        │
│   - NotesInput with preset examples                         │
│   - Live Ollama status indicator & model detector           │
│   - Dynamic task cards with inline editing                  │
│   - LocalStorage persistence                                │
+──────────────────────────────┬──────────────────────────────+
                               │ HTTP REST (Port 5173 -> 8000)
                               ▼
+─────────────────────────────────────────────────────────────+
│                      FASTAPI BACKEND                        │
│   - Temporal Context Engine (local date/timezone)           │
│   - Pydantic v2 Schema Sanitization & Auto-Repair           │
│   - Error Classification (Timeout, Offline, Missing Model)  │
+──────────────────────────────┬──────────────────────────────+
                               │ Constrained JSON Generation
                               ▼
+─────────────────────────────────────────────────────────────+
│                 OLLAMA RUNTIME (Localhost:11434)            │
│   - Open-Weight Model: Llama 3.2 (3B)                       │
│   - Low temperature (0.1) for deterministic output          │
+─────────────────────────────────────────────────────────────+
```

---

## 🚀 Getting Started

### Prerequisites
* **Python 3.11+**
* **Node.js 18+** & **npm**
* **Ollama** installed from [ollama.com](https://ollama.com)

---

### Step 1: Start the Local AI Model (Ollama)

1. Install and start Ollama on your system.
2. Pull the recommended open-weight model:
   ```bash
   ollama pull llama3.2
   ```
3. Start the Ollama server (if not already running as a background service):
   ```bash
   ollama serve
   ```

---

### Step 2: Start the Backend (FastAPI)

1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   # Windows (PowerShell):
   python -m venv venv
   .\venv\Scripts\Activate.ps1

   # macOS / Linux:
   python3 -m venv venv
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Copy the environment template:
   ```bash
   cp .env.example .env
   ```
5. Launch the backend server:
   ```bash
   python -m app.main
   ```
   *The API will be available at `http://127.0.0.1:8000` (Interactive docs at `http://127.0.0.1:8000/docs`).*

---

### Step 3: Start the Frontend (React + Vite)

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Open **`http://localhost:5173`** in your browser.

---

## 🐳 Running with Docker Compose

To run the complete stack (Backend + Frontend + Ollama) in Docker:
```bash
docker-compose up --build
```
*Note: Make sure to pull `llama3.2` into the Ollama container once running: `docker exec -it lazydesk-ollama ollama pull llama3.2`.*

---

## ⚙️ Configuration Reference (`backend/.env`)

| Variable | Default | Description |
| :--- | :--- | :--- |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Address of local Ollama server |
| `OLLAMA_MODEL` | `llama3.2` | Model identifier (`llama3.2`, `gemma2:2b`, `mistral`) |
| `OLLAMA_TIMEOUT` | `120` | Max seconds to wait for model inference |
| `BACKEND_HOST` | `127.0.0.1` | Host to bind the FastAPI server |
| `BACKEND_PORT` | `8000` | Port for the FastAPI server |
| `FRONTEND_ORIGIN`| `http://localhost:5173`| Allowed origin for CORS |
| `LOCAL_TIMEZONE` | `Asia/Kolkata` | IANA timezone for calculating relative dates |
| `DEMO_MODE` | `false` | When `true`, returns mock responses (for review when Ollama is unavailable) |

---

## 🧪 Testing & Verification

### Run Backend Tests
The backend contains 39 automated tests covering schemas, input boundaries, Ollama connection loss, model timeouts, and date resolution:
```bash
cd backend
python -m pytest tests/ -v
```
**Result**: `39 passed, 0 failures`

### Run Frontend Build
Validate that the React application builds cleanly with zero errors:
```bash
cd frontend
npm run build
```
**Result**: `✓ built in ~250ms`

---

## 📖 API Documentation

### `POST /api/organize`
Organizes raw notes into structured tasks.
- **Request Body**:
  ```json
  {
    "notes": "Finish my DBMS assignment by Thursday, revise graphs for tomorrow's test, and email the professor."
  }
  ```
- **Response**:
  ```json
  {
    "summary": "Academic deadlines approaching with exam preparation and assignment submissions.",
    "tasks": [
      {
        "id": "e7b0a70f-1558-45d6-a4bc-fa3cb8f21977",
        "title": "Revise graphs for tomorrow's test",
        "description": "Exam preparation",
        "priority": "high",
        "category": "College",
        "deadline": "2026-10-22",
        "deadline_uncertain": false,
        "completed": false
      },
      {
        "id": "87c47a9b-75c1-4b13-a44b-4f95ef9ee0c3",
        "title": "Finish DBMS assignment",
        "description": "Due Thursday",
        "priority": "high",
        "category": "College",
        "deadline": "2026-10-22",
        "deadline_uncertain": false,
        "completed": false
      }
    ],
    "model_used": "llama3.2",
    "processed_at": "2026-10-21T12:56:00.000000"
  }
  ```

### `GET /api/health`
Health check reporting backend uptime and Ollama connection status.

### `GET /api/models`
Returns the list of locally available models on the host machine.

---

## 📚 Detailed Documentation

- [Architecture & System Design](docs/ARCHITECTURE.md)
- [Open-Source AI & The "Slow and Steady" Philosophy](docs/OPEN_SOURCE_AI.md)
- [DEV Community Submission Article](docs/DEV_ARTICLE.md)
- [Hacktoberfest Submission Checklist](docs/SUBMISSION_CHECKLIST.md)

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
