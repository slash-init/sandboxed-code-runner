import { useState, useEffect } from 'react';
import { Cpu, Wifi, WifiOff } from 'lucide-react';
import ThemeSelector from './ThemeSelector';
import { healthCheck } from '../lib/api';
import './Header.css';

export default function Header() {
  const [connected, setConnected] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;

    const check = async () => {
      const ok = await healthCheck();
      if (mounted) setConnected(ok);
    };

    check();
    const interval = setInterval(check, 15000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <header className="header-bar" role="banner">
      <div className="header-inner">
        {/* Left: branding */}
        <div className="header-brand">
          <div className="header-logo" aria-hidden="true">
            <Cpu size={20} />
          </div>
          <div className="header-titles">
            <h1 className="header-title">Code Runner</h1>
            <p className="header-subtitle">Sandboxed · Isolated · Real-time</p>
          </div>
        </div>

        {/* Right: controls */}
        <div className="header-controls">
          {/* Connection status */}
          <div
            className="connection-indicator"
            role="status"
            aria-label={
              connected === null
                ? 'Checking backend connection'
                : connected
                ? 'Backend connected'
                : 'Backend disconnected'
            }
            title={
              connected === null
                ? 'Checking...'
                : connected
                ? 'Backend connected'
                : 'Backend offline'
            }
          >
            {connected === null ? (
              <div className="connection-dot connection-dot--checking" />
            ) : connected ? (
              <>
                <Wifi size={13} className="connection-icon connection-icon--online" />
                <span className="connection-label">Connected</span>
              </>
            ) : (
              <>
                <WifiOff size={13} className="connection-icon connection-icon--offline" />
                <span className="connection-label">Offline</span>
              </>
            )}
          </div>

          <div className="header-divider" aria-hidden="true" />

          {/* Theme selector */}
          <ThemeSelector />
        </div>
      </div>
    </header>
  );
}
