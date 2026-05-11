import { useState, useRef, useEffect } from 'react';
import { useTheme, THEMES, type ThemeName } from '../context/ThemeContext';
import { Palette, Check } from 'lucide-react';
import './ThemeSelector.css';

export default function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  const handleSelect = (id: ThemeName) => {
    setTheme(id);
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent, id: ThemeName) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSelect(id);
    }
  };

  return (
    <div className="theme-selector" ref={containerRef}>
      <button
        className="theme-trigger"
        onClick={() => setOpen(o => !o)}
        aria-label="Select theme"
        aria-expanded={open}
        aria-haspopup="listbox"
        title="Change theme"
      >
        <Palette size={16} />
        <span className="theme-trigger-label">Theme</span>
      </button>

      {open && (
        <div
          className="theme-menu"
          role="listbox"
          aria-label="Available themes"
          ref={menuRef}
        >
          {THEMES.map(t => (
            <button
              key={t.id}
              role="option"
              aria-selected={t.id === theme}
              className={`theme-option ${t.id === theme ? 'theme-option--active' : ''}`}
              onClick={() => handleSelect(t.id)}
              onKeyDown={(e) => handleKeyDown(e, t.id)}
            >
              <div className="theme-preview">
                <div
                  className="theme-swatch"
                  style={{ background: t.preview.bg }}
                >
                  <div
                    className="theme-swatch-accent"
                    style={{ background: t.preview.accent }}
                  />
                  <div
                    className="theme-swatch-surface"
                    style={{ background: t.preview.surface }}
                  />
                </div>
              </div>
              <div className="theme-info">
                <span className="theme-name">{t.label}</span>
                <span className="theme-desc">{t.description}</span>
              </div>
              {t.id === theme && (
                <Check size={14} className="theme-check" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
