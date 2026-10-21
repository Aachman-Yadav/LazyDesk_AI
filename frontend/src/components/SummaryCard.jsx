import { FileText, Sparkles } from 'lucide-react';

/**
 * SummaryCard - Displays the AI-generated summary and task statistics.
 */
export default function SummaryCard({ summary, tasks }) {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  const high = tasks.filter((t) => t.priority === 'high').length;
  const medium = tasks.filter((t) => t.priority === 'medium').length;
  const low = tasks.filter((t) => t.priority === 'low').length;

  return (
    <div
      className="glass-card animate-fade-in"
      style={{ padding: '24px 28px', marginBottom: '24px' }}
      role="region"
      aria-label="AI summary"
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
        <div
          style={{
            background: 'rgba(252,163,17,0.15)',
            borderRadius: '8px',
            padding: '8px',
          }}
        >
          <Sparkles size={16} color="#FCA311" />
        </div>
        <h2 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          AI Summary
        </h2>
      </div>

      {/* Summary text */}
      <p style={{ fontSize: '15px', lineHeight: 1.7, color: 'var(--color-text-primary)', marginBottom: '20px' }}>
        {summary}
      </p>

      <hr className="section-divider" style={{ marginBottom: '20px' }} />

      {/* Stats row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
          gap: '12px',
        }}
      >
        <Stat label="Total" value={total} color="var(--color-text-primary)" />
        <Stat label="Done" value={`${completed}/${total}`} color="#22C55E" />
        <Stat label="🔴 High" value={high} color="#FCA5A5" />
        <Stat label="🟡 Medium" value={medium} color="#FCD34D" />
        <Stat label="🟢 Low" value={low} color="#86EFAC" />
      </div>
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: '12px 8px',
        background: 'rgba(255,255,255,0.03)',
        borderRadius: '10px',
        border: '1px solid var(--color-border-subtle)',
      }}
    >
      <div style={{ fontSize: '22px', fontWeight: 800, color, lineHeight: 1.2 }}>
        {value}
      </div>
      <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px', fontWeight: 500 }}>
        {label}
      </div>
    </div>
  );
}
