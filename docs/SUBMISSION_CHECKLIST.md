# Hacktoberfest 2026 Week 3 — Submission Checklist

**Challenge**: Hacktoberfest Open-Source AI Challenge: Week 3 (October 19–25, 2026)  
**Theme**: *Slow and Steady*  
**Project**: **LazyDesk AI**  
**Submission URL**: [https://dev.to/challenges/hacktoberfest-week3-2026-10-19](https://dev.to/challenges/hacktoberfest-week3-2026-10-19)

---

## 1. Challenge Eligibility Requirements

- [x] **Open-Weight or Open-Source AI Component**:
  - Uses Meta's open-weight **Llama 3.2** (3B parameters) or Google's **Gemma 2** (2B) running locally via Ollama.
  - No proprietary black-box cloud APIs (OpenAI, Anthropic) required for operation.
- [x] **Automates a Repetitive Task & Saves User Time**:
  - Automatically parses chaotic natural language notes into prioritized, structured task lists with deadlines and categories.
  - Eliminates manual form entry (title, priority, date, category) for every single task.
- [x] **Explains Why Open Innovation Matters**:
  - Covered extensively in `docs/OPEN_SOURCE_AI.md`, `README.md`, the UI footer, and the DEV submission article (`docs/DEV_ARTICLE.md`).
  - Highlights privacy, data sovereignty, predictability, zero recurring token costs, and long-term offline durability.
- [x] **Aligns with "Slow and Steady" Theme**:
  - Focuses on dependable local software over fragile cloud hype.
  - Implements defensive Pydantic schema validation, resilient self-healing JSON parsing, offline persistence, and zero vendor lock-in.

---

## 2. Technical Deliverables

- [x] **Working Full-Stack Application**:
  - Backend: FastAPI, Pydantic v2, HTTPX, Uvicorn (Python 3.11+).
  - Frontend: React 18, Vite, Lucide Icons, responsive dark glassmorphism UI design tokens.
  - Local AI Runtime: Ollama integration with JSON mode decoding.
- [x] **Comprehensive Test Suite**:
  - 39 automated tests covering API endpoints, input validation, Ollama connection errors, timeout recovery, and relative deadline calculations.
  - Status: **39 passed** (`pytest tests/ -v`).
- [x] **Frontend Production Build**:
  - Zero build errors (`npm run build` succeeds).
- [x] **Documentation & Setup Guides**:
  - Professional `README.md` with complete installation commands and troubleshooting.
  - Detailed system architecture (`docs/ARCHITECTURE.md`).
  - Open innovation essay (`docs/OPEN_SOURCE_AI.md`).
  - Ready-to-publish DEV post (`docs/DEV_ARTICLE.md`).
- [x] **Docker Compose Configuration**:
  - `docker-compose.yml`, `backend/Dockerfile`, `frontend/Dockerfile`, `frontend/nginx.conf` provided for containerized evaluation.
- [x] **Open-Source License**:
  - MIT License included in `LICENSE`.

---

## 3. Pre-Publishing Review

Before publishing to GitHub and DEV.to:
1. Initialize git repository and make clean initial commit.
2. Push repository to public GitHub repository (`https://github.com/<username>/lazydesk-ai`).
3. Take and commit application screenshots into `screenshots/`.
4. Copy `docs/DEV_ARTICLE.md` to DEV.to editor (or publish draft) with appropriate tags (`#hacktoberfest`, `#opensource`, `#ai`, `#webdev`).
5. Ensure AI disclosure meets DEV guidelines (`some_ai`).
