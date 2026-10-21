/**
 * LazyDesk AI - API Service
 * All communication with the FastAPI backend lives here.
 * The backend URL is configurable via VITE_BACKEND_URL environment variable.
 */

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';

/**
 * Check backend and Ollama health status.
 * @returns {Promise<{status: string, ollama_reachable: boolean, model_configured: string, demo_mode: boolean}>}
 */
export async function checkHealth() {
  const resp = await fetch(`${BACKEND_URL}/health`, {
    headers: { Accept: 'application/json' },
  });
  if (!resp.ok) throw new Error(`Health check failed: HTTP ${resp.status}`);
  return resp.json();
}

/**
 * List available Ollama models.
 * @returns {Promise<{ollama_reachable: boolean, models: string[], error: string|null}>}
 */
export async function listModels() {
  const resp = await fetch(`${BACKEND_URL}/api/models`, {
    headers: { Accept: 'application/json' },
  });
  if (!resp.ok) throw new Error(`Models request failed: HTTP ${resp.status}`);
  return resp.json();
}

/**
 * Send notes to the backend for AI organization.
 * @param {string} notes - The user's raw unstructured notes
 * @returns {Promise<{summary: string, tasks: Task[], model_used: string, processed_at: string}>}
 */
export async function organizeTasks(notes) {
  const resp = await fetch(`${BACKEND_URL}/api/organize`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ notes }),
  });

  if (!resp.ok) {
    let detail = null;
    try {
      const body = await resp.json();
      detail = body.detail;
    } catch (_) {}

    if (resp.status === 503) {
      throw new OllamaUnavailableError(
        detail?.message ||
          'Ollama is not running. Start it with: ollama serve',
        detail?.help
      );
    }
    if (resp.status === 504) {
      throw new OllamaTimeoutError(
        detail?.message || 'The AI model timed out. Try again or use a smaller model.',
        detail?.help
      );
    }
    if (resp.status === 404) {
      throw new ModelNotFoundError(
        detail?.message ||
          `Model not found. Pull it with: ollama pull ${detail?.model || 'llama3.2'}`,
        detail?.help
      );
    }
    if (resp.status === 422) {
      throw new ValidationError(
        detail?.message || detail || 'Invalid input or model response.',
        detail?.help
      );
    }
    throw new Error(
      typeof detail === 'string' ? detail : `Request failed: HTTP ${resp.status}`
    );
  }

  return resp.json();
}

// ---------------------------------------------------------------------------
// Custom error types for typed error handling in the UI
// ---------------------------------------------------------------------------

export class OllamaUnavailableError extends Error {
  constructor(message, help) {
    super(message);
    this.name = 'OllamaUnavailableError';
    this.help = help;
  }
}

export class OllamaTimeoutError extends Error {
  constructor(message, help) {
    super(message);
    this.name = 'OllamaTimeoutError';
    this.help = help;
  }
}

export class ModelNotFoundError extends Error {
  constructor(message, help) {
    super(message);
    this.name = 'ModelNotFoundError';
    this.help = help;
  }
}

export class ValidationError extends Error {
  constructor(message, help) {
    super(message);
    this.name = 'ValidationError';
    this.help = help;
  }
}
