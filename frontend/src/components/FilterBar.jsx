/**
 * FilterBar - Priority and status filter pills above the task list.
 */
export default function FilterBar({ filter, onFilterChange, taskCounts }) {
  const filters = [
    { key: 'all', label: `All (${taskCounts.all})` },
    { key: 'high', label: `🔴 High (${taskCounts.high})` },
    { key: 'medium', label: `🟡 Medium (${taskCounts.medium})` },
    { key: 'low', label: `🟢 Low (${taskCounts.low})` },
    { key: 'completed', label: `✓ Done (${taskCounts.completed})` },
    { key: 'pending', label: `⏳ Pending (${taskCounts.pending})` },
  ];

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
        marginBottom: '20px',
        alignItems: 'center',
      }}
      role="group"
      aria-label="Filter tasks"
    >
      <span
        style={{
          fontSize: '12px',
          color: 'var(--color-text-muted)',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          marginRight: '4px',
        }}
      >
        Filter:
      </span>
      {filters.map((f) => (
        <button
          key={f.key}
          id={`filter-${f.key}`}
          className={`filter-pill ${filter === f.key ? 'active' : ''}`}
          onClick={() => onFilterChange(f.key)}
          aria-pressed={filter === f.key}
          aria-label={`Show ${f.label} tasks`}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
