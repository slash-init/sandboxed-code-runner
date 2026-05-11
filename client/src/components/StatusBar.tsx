import { Command, CornerDownLeft } from 'lucide-react';
import './StatusBar.css';

interface StatusBarProps {
  language: string;
  extension: string;
  execTimeMs: number | null;
}

export default function StatusBar({ language, extension, execTimeMs }: StatusBarProps) {
  const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);

  return (
    <footer className="status-bar" role="contentinfo">
      <div className="status-bar-inner">
        {/* Left */}
        <div className="status-left">
          <span className="status-item status-lang">
            {language}
            <span className="status-ext">{extension}</span>
          </span>
          {execTimeMs !== null && (
            <span className="status-item status-time">
              {execTimeMs < 1000
                ? `${execTimeMs}ms`
                : `${(execTimeMs / 1000).toFixed(2)}s`}
            </span>
          )}
        </div>

        {/* Right */}
        <div className="status-right">
          <span className="status-shortcut" aria-label={`Press ${isMac ? 'Command' : 'Control'} Enter to run code`}>
            {isMac ? (
              <Command size={10} />
            ) : (
              <span className="status-key">Ctrl</span>
            )}
            <span className="status-key-plus">+</span>
            <CornerDownLeft size={10} />
            <span className="status-key-label">Run</span>
          </span>
        </div>
      </div>
    </footer>
  );
}
