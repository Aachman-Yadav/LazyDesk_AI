import { useEffect, useState } from 'react';
import { Wifi, WifiOff, Cpu, AlertCircle } from 'lucide-react';
import { checkHealth } from '../services/api';

/**
 * AIStatus - Shows local AI / Ollama connectivity status in the header.
 * Polls every 30 seconds.
 */
export default function AIStatus() {
  const [status, setStatus] = useState('checking'); // 'online' | 'offline' | 'checking'
  const [model, setModel] = useState('');
  const [demoMode, setDemoMode] = useState(false);

  async function poll() {
    try {
      const data = await checkHealth();
      setDemoMode(data.demo_mode);
      if (data.demo_mode) {
        setStatus('demo');
        setModel('demo');
      } else if (data.ollama_reachable) {
        setStatus('online');
        setModel(data.model_configured);
      } else {
        setStatus('offline');
        setModel(data.model_configured);
      }
    } catch {
      setStatus('offline');
    }
  }

  useEffect(() => {
    poll();
    const interval = setInterval(poll, 30_000);
    return () => clearInterval(interval);
  }, []);

  const configs = {
    online: {
      dot: 'online',
      label: 'AI Online',
      icon: <Wifi size={13} />,
      color: '#22C55E',
    },
    offline: {
      dot: 'offline',
      label: 'Ollama offline',
      icon: <WifiOff size={13} />,
      color: '#EF4444',
    },
    demo: {
      dot: 'checking',
      label: 'Demo mode',
      icon: <AlertCircle size={13} />,
      color: '#F59E0B',
    },
    checking: {
      dot: 'checking',
      label: 'Checking…',
      icon: <Cpu size={13} />,
      color: '#F59E0B',
    },
  };

  const cfg = configs[status] || configs.checking;

  return (
    <div className="flex items-center gap-2">
      {/* Status pill */}
      <div
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
        style={{
          background: `rgba(${status === 'online' ? '34,197,94' : status === 'offline' ? '239,68,68' : '245,158,11'},0.12)`,
          border: `1px solid rgba(${status === 'online' ? '34,197,94' : status === 'offline' ? '239,68,68' : '245,158,11'},0.3)`,
          color: cfg.color,
        }}
        title={model ? `Model: ${model}` : 'Checking Ollama status…'}
        aria-label={`AI status: ${cfg.label}`}
      >
        <span className={`status-dot ${cfg.dot}`} aria-hidden="true" />
        <span className="hide-mobile">{cfg.label}</span>
        {model && status === 'online' && (
          <span className="hide-mobile" style={{ color: 'rgba(34,197,94,0.7)' }}>
            · {model}
          </span>
        )}
      </div>

      {/* Privacy indicator */}
      <div
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium hide-mobile"
        style={{
          background: 'rgba(99,102,241,0.1)',
          border: '1px solid rgba(99,102,241,0.25)',
          color: '#A5B4FC',
        }}
        title="Your notes are processed locally — never sent to external servers"
      >
        🔒 Local AI
      </div>
    </div>
  );
}
