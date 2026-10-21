import { Lock, GitBranch, Cpu } from 'lucide-react';

/**
 * Footer - Open-source AI explanation, model info, and links.
 */
export default function Footer({ modelUsed }) {
  return (
    <footer
      style={{
        borderTop: '1px solid var(--color-border-subtle)',
        marginTop: 'auto',
        padding: '40px 24px 32px',
      }}
    >
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        {/* Open-source AI explanation */}
        <div
          className="glass-card"
          style={{ padding: '24px 28px', marginBottom: '28px' }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
            <div
              style={{
                background: 'rgba(252,163,17,0.15)',
                borderRadius: '10px',
                padding: '10px',
                flexShrink: 0,
              }}
            >
              <Cpu size={20} color="#FCA311" />
            </div>
            <div>
              <h3
                style={{
                  fontSize: '15px',
                  fontWeight: 700,
                  color: 'var(--color-text-primary)',
                  marginBottom: '8px',
                }}
              >
                Why Open-Weight AI?
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>
                LazyDesk AI uses <strong style={{ color: '#FCA311' }}>open-weight models</strong> via{' '}
                <strong style={{ color: '#FCA311' }}>Ollama</strong> — meaning the model weights are
                publicly available and run entirely on your machine. This is different from{' '}
                <em>fully open source</em>, which would also include training code and data.
                Open weights give you privacy (notes never leave your device), zero per-request API costs,
                the freedom to swap models, and the ability to work offline once the model is downloaded.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
            {modelUsed && (
              <span
                style={{
                  fontSize: '12px',
                  color: 'var(--color-text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Cpu size={12} />
                Runtime: {modelUsed}
              </span>
            )}
            <span
              style={{
                fontSize: '12px',
                color: 'var(--color-text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Lock size={12} />
              Notes processed locally · Never sent to external servers
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <a
              href="https://github.com/YOUR_USERNAME/lazydesk-ai"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                color: 'var(--color-text-muted)',
                textDecoration: 'none',
                transition: 'color 150ms ease',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = '#FCA311')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text-muted)')}
            >
              <GitBranch size={13} />
              Source Code
            </a>
            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
              MIT License · Hacktoberfest 2026
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
