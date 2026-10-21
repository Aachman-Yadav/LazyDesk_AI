import { useState, useEffect } from 'react';
import { AlertCircle, WifiOff, Clock, RefreshCw, Terminal } from 'lucide-react';
import Header from './components/Header';
import Hero from './components/Hero';
import NotesInput from './components/NotesInput';
import TaskList from './components/TaskList';
import Footer from './components/Footer';
import { organizeTasks, OllamaUnavailableError, OllamaTimeoutError, ModelNotFoundError } from './services/api';

// LocalStorage key for workspace persistence
const STORAGE_KEY = 'lazydesk_workspace_v1';

/**
 * Skeleton loader for the results section
 */
function LoadingSkeleton() {
  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', padding: '20px', background: 'rgba(252,163,17,0.06)', borderRadius: '12px', border: '1px solid rgba(252,163,17,0.15)' }}>
        <div className="animate-spin-slow" style={{ flexShrink: 0 }}>
          <div style={{ width: '28px', height: '28px', border: '3px solid rgba(252,163,17,0.3)', borderTopColor: '#FCA311', borderRadius: '50%' }} />
        </div>
        <div>
          <p style={{ fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
            Processing your notes…
          </p>
          <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
            The local model is reading and organizing your tasks. This may take 15–60 seconds.
          </p>
        </div>
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} style={{ marginBottom: '12px', padding: '20px', borderRadius: '12px', border: '1px solid var(--color-border-subtle)' }}>
          <div className="skeleton" style={{ height: '18px', width: '65%', marginBottom: '10px' }} />
          <div className="skeleton" style={{ height: '13px', width: '85%', marginBottom: '8px' }} />
          <div style={{ display: 'flex', gap: '8px' }}>
            <div className="skeleton" style={{ height: '22px', width: '64px', borderRadius: '20px' }} />
            <div className="skeleton" style={{ height: '22px', width: '72px', borderRadius: '20px' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Error display with context-specific help messages
 */
function ErrorDisplay({ error, onRetry }) {
  const isOllamaDown = error instanceof OllamaUnavailableError;
  const isTimeout = error instanceof OllamaTimeoutError;
  const isModelMissing = error instanceof ModelNotFoundError;

  const icon = isOllamaDown ? <WifiOff size={20} color="#EF4444" /> : isTimeout ? <Clock size={20} color="#F59E0B" /> : <AlertCircle size={20} color="#EF4444" />;
  const borderColor = isTimeout ? 'rgba(245,158,11,0.3)' : 'rgba(239,68,68,0.3)';
  const bgColor = isTimeout ? 'rgba(245,158,11,0.06)' : 'rgba(239,68,68,0.06)';

  return (
    <div
      className="glass-card animate-fade-in"
      style={{ padding: '24px', borderLeft: `3px solid ${borderColor}`, background: bgColor, marginBottom: '24px' }}
      role="alert"
    >
      <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
        <div style={{ flexShrink: 0, marginTop: '2px' }}>{icon}</div>
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 700, fontSize: '15px', marginBottom: '8px', color: 'var(--color-text-primary)' }}>
            {isOllamaDown
              ? 'Ollama is not running'
              : isTimeout
              ? 'Request timed out'
              : isModelMissing
              ? 'Model not found'
              : 'Something went wrong'}
          </p>
          <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.7, marginBottom: '12px' }}>
            {error.message}
          </p>

          {/* Contextual help */}
          {(isOllamaDown || isModelMissing) && (
            <div
              style={{
                background: 'rgba(0,0,0,0.4)',
                borderRadius: '8px',
                padding: '12px 16px',
                marginBottom: '14px',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Terminal size={12} /> Run these commands to fix it:
              </p>
              <code style={{ fontSize: '13px', color: '#FCA311', display: 'block', lineHeight: 1.8 }}>
                {isOllamaDown ? (
                  <>
                    ollama serve<br />
                    <span style={{ color: 'var(--color-text-muted)' }}># Then refresh this page</span>
                  </>
                ) : (
                  <>ollama pull llama3.2</>
                )}
              </code>
            </div>
          )}

          <button onClick={onRetry} className="btn-secondary" style={{ fontSize: '13px' }}>
            <RefreshCw size={13} /> Try again
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Main App component
 */
export default function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);  // full API response
  const [tasks, setTasks] = useState([]);       // mutable task array
  const [lastNotes, setLastNotes] = useState(''); // for retry

  // Restore workspace from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const { result: r, tasks: t } = JSON.parse(saved);
        if (r && Array.isArray(t) && t.length > 0) {
          setResult(r);
          setTasks(t);
        }
      }
    } catch { /* ignore corrupt storage */ }
  }, []);

  // Persist workspace to localStorage on change (exclude private notes)
  useEffect(() => {
    if (result && tasks.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ result, tasks }));
      } catch { /* storage quota — ignore */ }
    }
  }, [result, tasks]);

  async function handleSubmit(notes) {
    setLastNotes(notes);
    setIsLoading(true);
    setError(null);
    setResult(null);
    setTasks([]);

    try {
      const data = await organizeTasks(notes);
      setResult(data);
      setTasks(data.tasks || []);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }

  function handleRetry() {
    if (lastNotes) handleSubmit(lastNotes);
  }

  function handleReset() {
    setResult(null);
    setTasks([]);
    setError(null);
    setLastNotes('');
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  }

  const hasResults = result !== null && !isLoading;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />

      <main
        style={{
          flex: 1,
          maxWidth: '860px',
          width: '100%',
          margin: '0 auto',
          padding: '0 24px 40px',
          boxSizing: 'border-box',
        }}
      >
        {/* Hero — only show before first result */}
        {!hasResults && !isLoading && <Hero />}

        {/* Input (always visible) */}
        {!hasResults && (
          <NotesInput onSubmit={handleSubmit} isLoading={isLoading} />
        )}

        {/* Loading skeleton */}
        {isLoading && <LoadingSkeleton />}

        {/* Error */}
        {error && !isLoading && (
          <ErrorDisplay error={error} onRetry={handleRetry} />
        )}

        {/* Results */}
        {hasResults && (
          <TaskList
            result={result}
            tasks={tasks}
            onTasksChange={setTasks}
            onReset={handleReset}
          />
        )}
      </main>

      <Footer modelUsed={result?.model_used} />
    </div>
  );
}
