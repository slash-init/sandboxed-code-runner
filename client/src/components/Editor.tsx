import { useState, useEffect, useRef, useCallback } from 'react';
import CodeEditor from '@uiw/react-textarea-code-editor';
import {
  Play,
  Loader2,
  Terminal,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Copy,
  Check,
  Trash2,
} from 'lucide-react';
import { runCode, type RunResponse, type ApiError } from '../lib/api';
import './Editor.css';

const LANGUAGES = [
  { value: 'python' as const, label: 'Python', ext: '.py' },
  { value: 'cpp' as const, label: 'C++', ext: '.cpp' },
];

const DEFAULT_CODE: Record<string, string> = {
  python: `def greet(name: str) -> str:\n    return f"Hello, {name}!"\n\nprint(greet("World"))`,
  cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}`,
};

type Language = 'python' | 'cpp';

interface EditorProps {
  onLanguageChange?: (lang: Language, ext: string) => void;
  onExecTime?: (ms: number | null) => void;
}

export default function Editor({ onLanguageChange, onExecTime }: EditorProps) {
  const [code, setCode] = useState(DEFAULT_CODE['python']);
  const [language, setLanguage] = useState<Language>('python');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [execTimeMs, setExecTimeMs] = useState<number | null>(null);

  const langDropdownRef = useRef<HTMLDivElement>(null);
  const langMenuRef = useRef<HTMLDivElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  // Report language changes upstream
  useEffect(() => {
    const lang = LANGUAGES.find(l => l.value === language)!;
    onLanguageChange?.(language, lang.ext);
  }, [language, onLanguageChange]);

  // Report exec time upstream
  useEffect(() => {
    onExecTime?.(execTimeMs);
  }, [execTimeMs, onExecTime]);

  // Close language dropdown on click outside
  useEffect(() => {
    if (!langOpen) return;
    const handler = (e: MouseEvent) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [langOpen]);

  // Close on Escape
  useEffect(() => {
    if (!langOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLangOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [langOpen]);

  const handleLangChange = (val: Language) => {
    setLanguage(val);
    setCode(DEFAULT_CODE[val]);
    setLangOpen(false);
    setOutput('');
    setStatus('');
    setExecTimeMs(null);
  };

  const handleRun = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    setOutput('');
    setStatus('');
    setCopied(false);

    const startTime = performance.now();

    try {
      const res: RunResponse = await runCode({ language, code, input });
      const elapsed = Math.round(performance.now() - startTime);
      setExecTimeMs(elapsed);
      setOutput(res.stdout + (res.stderr ? '\n[stderr]\n' + res.stderr : ''));
      setStatus(res.status.toUpperCase());
    } catch (err: unknown) {
      const elapsed = Math.round(performance.now() - startTime);
      setExecTimeMs(elapsed);
      const apiErr = err as ApiError;
      setOutput(apiErr.message || 'An unexpected error occurred');
      setStatus('ERROR');
    } finally {
      setLoading(false);
    }
  }, [language, code, input, loading]);

  // Keyboard shortcut: Ctrl+Enter / Cmd+Enter
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleRun();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [handleRun]);

  const handleCopy = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API may be unavailable
    }
  };

  const handleClear = () => {
    setOutput('');
    setStatus('');
    setExecTimeMs(null);
  };

  const currentLang = LANGUAGES.find(l => l.value === language)!;

  const statusConfig: Record<string, { icon: typeof CheckCircle2; color: string; glow: string; bg: string }> = {
    SUCCESS: {
      icon: CheckCircle2,
      color: 'var(--status-success)',
      glow: 'var(--status-success-glow)',
      bg: 'var(--status-success-bg)',
    },
    ERROR: {
      icon: XCircle,
      color: 'var(--status-error)',
      glow: 'var(--status-error-glow)',
      bg: 'var(--status-error-bg)',
    },
    RUNTIME_ERROR: {
      icon: XCircle,
      color: 'var(--status-error)',
      glow: 'var(--status-error-glow)',
      bg: 'var(--status-error-bg)',
    },
    TIMEOUT: {
      icon: AlertTriangle,
      color: 'var(--status-warning)',
      glow: 'var(--status-warning-glow)',
      bg: 'var(--status-warning-bg)',
    },
  };

  const sc = status ? statusConfig[status] ?? statusConfig['ERROR'] : null;
  const StatusIcon = sc?.icon;

  return (
    <div className="editor-grid" id="editor-main">
      {/* Left: Code editor panel */}
      <div className="glass-panel editor-panel">
        {/* Toolbar */}
        <div className="editor-toolbar" role="toolbar" aria-label="Editor controls">
          <div className="toolbar-left">
            {/* Traffic light dots */}
            <div className="traffic-dots" aria-hidden="true">
              <div className="traffic-dot traffic-dot--red" />
              <div className="traffic-dot traffic-dot--yellow" />
              <div className="traffic-dot traffic-dot--green" />
            </div>

            {/* Language selector */}
            <div className="lang-dropdown" ref={langDropdownRef}>
              <button
                className="lang-btn"
                onClick={() => setLangOpen(o => !o)}
                aria-label={`Language: ${currentLang.label}. Click to change.`}
                aria-expanded={langOpen}
                aria-haspopup="listbox"
                id="lang-selector"
              >
                {currentLang.label}
                <ChevronDown
                  size={12}
                  className={`lang-chevron ${langOpen ? 'lang-chevron--open' : ''}`}
                />
              </button>
              {langOpen && (
                <div
                  className="lang-menu"
                  role="listbox"
                  aria-labelledby="lang-selector"
                  ref={langMenuRef}
                >
                  {LANGUAGES.map(l => (
                    <button
                      key={l.value}
                      role="option"
                      aria-selected={l.value === language}
                      className={`lang-option ${l.value === language ? 'lang-option--active' : ''}`}
                      onClick={() => handleLangChange(l.value)}
                    >
                      {l.label}
                      <span className="lang-ext">{l.ext}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <button
            className="run-btn"
            onClick={handleRun}
            disabled={loading}
            aria-label={loading ? 'Code is running' : 'Run code'}
            id="run-button"
          >
            {loading ? (
              <>
                <Loader2 size={15} className="spinner" />
                <span>Running</span>
              </>
            ) : (
              <>
                <Play size={15} />
                <span>Run</span>
                <span className="run-shortcut" aria-hidden="true">⌘↵</span>
              </>
            )}
          </button>
        </div>

        {/* Code editor */}
        <div
          className="code-area-wrapper"
          onClick={() => setLangOpen(false)}
          role="region"
          aria-label="Code editor"
        >
          <CodeEditor
            value={code}
            language={language === 'python' ? 'python' : 'cpp'}
            onChange={(e) => setCode(e.target.value)}
            data-color-mode="dark"
            padding={16}
            aria-label={`${currentLang.label} code editor`}
            style={{
              backgroundColor: 'transparent',
              fontSize: 13.5,
              fontFamily: "'JetBrains Mono', monospace",
              minHeight: 360,
              lineHeight: 1.7,
            }}
          />
        </div>

        {/* Stdin */}
        <div className="stdin-section">
          <label className="section-label stdin-label" htmlFor="stdin-input">
            <Terminal size={12} aria-hidden="true" />
            stdin
          </label>
          <textarea
            id="stdin-input"
            className="stdin-area"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Optional input..."
            rows={3}
            aria-label="Standard input for the program"
          />
        </div>
      </div>

      {/* Right: Output panel */}
      <div className="glass-panel editor-panel">
        {/* Output toolbar */}
        <div className="editor-toolbar output-toolbar" role="toolbar" aria-label="Output controls">
          <div className="section-label">
            <Terminal size={12} aria-hidden="true" />
            output
          </div>
          <div className="output-toolbar-right">
            {execTimeMs !== null && (
              <span className="exec-time" aria-label={`Execution time: ${execTimeMs} milliseconds`}>
                {execTimeMs < 1000 ? `${execTimeMs}ms` : `${(execTimeMs / 1000).toFixed(2)}s`}
              </span>
            )}
            {sc && StatusIcon && (
              <div
                className="status-badge"
                role="status"
                aria-label={`Status: ${status}`}
                style={{
                  color: sc.color,
                  background: sc.bg,
                  border: `1px solid ${sc.glow}`,
                  boxShadow: `0 0 12px ${sc.glow}`,
                }}
              >
                <StatusIcon size={12} />
                {status}
              </div>
            )}
            {output && (
              <>
                <button
                  className="action-btn"
                  onClick={handleCopy}
                  aria-label={copied ? 'Copied!' : 'Copy output'}
                  title={copied ? 'Copied!' : 'Copy output'}
                  id="copy-output"
                >
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                </button>
                <button
                  className="action-btn"
                  onClick={handleClear}
                  aria-label="Clear output"
                  title="Clear output"
                  id="clear-output"
                >
                  <Trash2 size={12} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Output content */}
        <div
          className="output-content"
          ref={outputRef}
          aria-live="polite"
          aria-atomic="true"
          role="log"
          aria-label="Program output"
        >
          {output ? (
            <pre className="output-pre">{output}</pre>
          ) : (
            <pre className="output-pre output-empty">
              {loading ? 'Executing...' : '▸  Run your code to see output here'}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}