import { Layers } from 'lucide-react';
import AIStatus from './AIStatus';

/**
 * Header - Top navigation bar with logo, tagline, and AI status.
 */
export default function Header() {
  return (
    <header
      style={{
        background: 'rgba(10,15,30,0.95)',
        borderBottom: '1px solid rgba(252,163,17,0.12)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <div
        style={{
          maxWidth: '1100px',
          margin: '0 auto',
          padding: '0 24px',
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              background: 'linear-gradient(135deg, #FCA311, #E8920A)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(252,163,17,0.35)',
              flexShrink: 0,
            }}
            aria-hidden="true"
          >
            <Layers size={18} color="#000" strokeWidth={2.5} />
          </div>
          <div>
            <h1
              style={{
                fontSize: '18px',
                fontWeight: 800,
                lineHeight: 1.1,
                letterSpacing: '-0.3px',
              }}
            >
              <span className="gradient-text">LazyDesk</span>
              <span style={{ color: 'rgba(255,255,255,0.9)' }}> AI</span>
            </h1>
            <p
              className="hide-mobile"
              style={{
                fontSize: '11px',
                color: 'var(--color-text-muted)',
                letterSpacing: '0.2px',
                lineHeight: 1,
              }}
            >
              Less organizing. More doing.
            </p>
          </div>
        </div>

        {/* AI Status */}
        <AIStatus />
      </div>
    </header>
  );
}
