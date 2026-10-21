import { Zap } from 'lucide-react';

/**
 * Hero - The main landing area above the input form.
 * Only shown when there are no results yet.
 */
export default function Hero() {
  return (
    <div style={{ textAlign: 'center', padding: '48px 0 32px' }}>
      {/* Badge */}
      <div
        className="animate-fade-in"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(252,163,17,0.12)',
          border: '1px solid rgba(252,163,17,0.3)',
          borderRadius: '20px',
          padding: '6px 16px',
          fontSize: '12px',
          fontWeight: 600,
          color: '#FCA311',
          marginBottom: '24px',
          letterSpacing: '0.3px',
        }}
      >
        <Zap size={13} fill="#FCA311" />
        Powered by Local Open-Weight AI · Hacktoberfest 2026
      </div>

      {/* Heading */}
      <h2
        className="animate-fade-in"
        style={{
          fontSize: 'clamp(28px, 5vw, 48px)',
          fontWeight: 800,
          lineHeight: 1.15,
          letterSpacing: '-1px',
          marginBottom: '16px',
          animationDelay: '60ms',
        }}
      >
        Let your tasks{' '}
        <span className="gradient-text">organize themselves.</span>
      </h2>

      {/* Subheading */}
      <p
        className="animate-fade-in"
        style={{
          fontSize: 'clamp(15px, 2vw, 18px)',
          color: 'var(--color-text-secondary)',
          maxWidth: '560px',
          margin: '0 auto 40px',
          lineHeight: 1.7,
          animationDelay: '120ms',
        }}
      >
        Paste your messy notes, scattered reminders, or brain dumps.
        A local AI model will extract tasks, identify deadlines, and
        return a clean, prioritized list — all without sending your
        data anywhere.
      </p>

      {/* Feature pills */}
      <div
        className="animate-fade-in"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '10px',
          justifyContent: 'center',
          marginBottom: '40px',
          animationDelay: '180ms',
        }}
      >
        {[
          '🔒 100% Local',
          '⚡ Open-Weight AI',
          '📋 Auto-Prioritized',
          '✏️ Editable Tasks',
          '📅 Deadline Detection',
        ].map((pill) => (
          <span
            key={pill}
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid var(--color-border-subtle)',
              borderRadius: '20px',
              padding: '6px 14px',
              fontSize: '13px',
              color: 'var(--color-text-secondary)',
              fontWeight: 500,
            }}
          >
            {pill}
          </span>
        ))}
      </div>
    </div>
  );
}
