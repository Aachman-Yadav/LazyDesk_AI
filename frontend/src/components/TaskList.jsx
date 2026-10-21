import { useState } from 'react';
import { Clipboard, ClipboardCheck, RefreshCw } from 'lucide-react';
import TaskCard from './TaskCard';
import FilterBar from './FilterBar';
import SummaryCard from './SummaryCard';

/**
 * TaskList - Renders the full results panel: summary, filter bar, task cards.
 * Handles task state updates (edit, complete, delete) and copy-to-clipboard.
 */
export default function TaskList({ result, tasks, onTasksChange, onReset }) {
  const [filter, setFilter] = useState('all');
  const [copied, setCopied] = useState(false);

  /* ---- task mutation helpers ---- */
  function handleUpdate(id, changes) {
    onTasksChange((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...changes } : t))
    );
  }

  function handleDelete(id) {
    onTasksChange((prev) => prev.filter((t) => t.id !== id));
  }

  /* ---- filtering ---- */
  const filtered = tasks.filter((t) => {
    if (filter === 'all') return true;
    if (filter === 'completed') return t.completed;
    if (filter === 'pending') return !t.completed;
    return t.priority === filter;
  });

  const counts = {
    all: tasks.length,
    high: tasks.filter((t) => t.priority === 'high').length,
    medium: tasks.filter((t) => t.priority === 'medium').length,
    low: tasks.filter((t) => t.priority === 'low').length,
    completed: tasks.filter((t) => t.completed).length,
    pending: tasks.filter((t) => !t.completed).length,
  };

  /* ---- copy to clipboard ---- */
  async function handleCopy() {
    const text = [
      `📋 LazyDesk AI — Organized Tasks`,
      ``,
      result?.summary ? `Summary: ${result.summary}` : '',
      ``,
      ...tasks.map(
        (t, i) =>
          `${i + 1}. [${t.priority.toUpperCase()}] ${t.title}` +
          (t.deadline ? ` — Due: ${t.deadline}` : '') +
          (t.completed ? ' ✓' : '') +
          (t.description ? `\n   ${t.description}` : '')
      ),
    ]
      .join('\n')
      .trim();

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback: select a textarea
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } catch {
        alert('Could not copy to clipboard. Please copy manually.');
      } finally {
        document.body.removeChild(ta);
      }
    }
  }

  /* ---- empty filter state ---- */
  const showEmpty = filtered.length === 0;

  return (
    <section aria-label="Organized tasks" className="animate-slide-up">
      {/* Summary */}
      {result?.summary && <SummaryCard summary={result.summary} tasks={tasks} />}

      {/* Action row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
          flexWrap: 'wrap',
          gap: '10px',
        }}
      >
        <h2 style={{ fontSize: '17px', fontWeight: 700 }}>
          Tasks
          <span style={{ color: 'var(--color-text-muted)', fontWeight: 400, fontSize: '14px', marginLeft: '8px' }}>
            ({tasks.length})
          </span>
        </h2>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            id="copy-tasks-btn"
            onClick={handleCopy}
            className="btn-secondary"
            aria-live="polite"
            aria-label={copied ? 'Copied to clipboard' : 'Copy tasks to clipboard'}
          >
            {copied ? <ClipboardCheck size={14} color="#22C55E" /> : <Clipboard size={14} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>

          <button
            id="reset-btn"
            onClick={onReset}
            className="btn-secondary"
            aria-label="Reset and start over"
          >
            <RefreshCw size={14} />
            Reset
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <FilterBar filter={filter} onFilterChange={setFilter} taskCounts={counts} />

      {/* Task cards */}
      {showEmpty ? (
        <div
          style={{
            textAlign: 'center',
            padding: '48px 24px',
            color: 'var(--color-text-muted)',
          }}
        >
          <p style={{ fontSize: '32px', marginBottom: '12px' }}>🦥</p>
          <p style={{ fontSize: '15px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text-secondary)' }}>
            No tasks match this filter
          </p>
          <p style={{ fontSize: '13px' }}>Try selecting a different filter above.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtered.map((task, index) => (
            <div
              key={task.id}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <TaskCard
                task={task}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
              />
            </div>
          ))}
        </div>
      )}

      {/* Model info footer */}
      {result?.model_used && (
        <p
          style={{
            marginTop: '20px',
            textAlign: 'center',
            fontSize: '12px',
            color: 'var(--color-text-muted)',
          }}
        >
          Organized by <strong style={{ color: 'rgba(252,163,17,0.8)' }}>{result.model_used}</strong>
          {result.processed_at && (
            <> · {new Date(result.processed_at).toLocaleTimeString()}</>
          )}
        </p>
      )}
    </section>
  );
}
