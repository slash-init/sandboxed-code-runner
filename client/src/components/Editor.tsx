import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Group, Panel, Separator } from 'react-resizable-panels';
import CodeEditor, { getEditorInstance } from './CodeEditor';
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
  Download,
  Sparkles,
  Share2,
  Link,
} from 'lucide-react';
import { runCode, saveSnippet, getSnippet, type RunResponse, type ApiError } from '../lib/api';
import './Editor.css';

const LANGUAGES = [
  { value: 'python' as const, label: 'Python', ext: '.py' },
  { value: 'cpp' as const, label: 'C++', ext: '.cpp' },
  { value: 'javascript' as const, label: 'JavaScript', ext: '.js' },
];

const DEFAULT_CODE: Record<string, string> = {
  python: `def greet(name: str) -> str:\n    return f"Hello, {name}!"\n\nprint(greet("World"))`,
  cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}`,
  javascript: `function greet(name) {\n  return \`Hello, \${name}!\`;\n}\n\nconsole.log(greet("World"));`,
};

type Language = 'python' | 'cpp' | 'javascript';

interface EditorProps {
  onLanguageChange?: (lang: Language, ext: string) => void;
  onExecTime?: (ms: number | null) => void;
  snippetId?: string;
}

export default function Editor({ onLanguageChange, onExecTime, snippetId }: EditorProps) {
  const navigate = useNavigate();
  const [code, setCode] = useState(DEFAULT_CODE['python']);
  const [language, setLanguage] = useState<Language>('python');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [execTimeMs, setExecTimeMs] = useState<number | null>(null);
  const [sharing, setSharing] = useState(false);
  const [shareToast, setShareToast] = useState<string | null>(null);
  const [snippetLoading, setSnippetLoading] = useState(!!snippetId);
  const [snippetError, setSnippetError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const langDropdownRef = useRef<HTMLDivElement>(null);
  const langMenuRef = useRef<HTMLDivElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);

  // Window resize handler
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load shared snippet on mount
  useEffect(() => {
    if (!snippetId) return;
    let cancelled = false;
    setSnippetLoading(true);
    setSnippetError(null);

    getSnippet(snippetId)
      .then((snippet) => {
        if (cancelled) return;
        setCode(snippet.code);
        setLanguage(snippet.language as Language);
        setInput(snippet.input || '');
        setSnippetLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        const apiErr = err as ApiError;
        setSnippetError(apiErr.message || 'Failed to load snippet');
        setSnippetLoading(false);
      });

    return () => { cancelled = true; };
  }, [snippetId]);

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

  // Copy output
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

  // Copy code
  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    } catch {
      // clipboard API may be unavailable
    }
  };

  // Download code
  const handleDownload = () => {
    const ext = LANGUAGES.find(l => l.value === language)!.ext;
    const filename = `code${ext}`;
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Format code
  const handleFormat = () => {
    const editor = getEditorInstance(editorContainerRef.current);
    if (editor) {
      editor.getAction('editor.action.formatDocument')?.run();
    }
  };

  const handleClear = () => {
    setOutput('');
    setStatus('');
    setExecTimeMs(null);
  };

  // Share code
  const handleShare = async () => {
    if (sharing) return;
    setSharing(true);
    setShareToast(null);

    try {
      const { id } = await saveSnippet({ language, code, input });
      const shareUrl = `${window.location.origin}/s/${id}`;

      // Update URL without full page reload
      navigate(`/s/${id}`, { replace: true });

      try {
        await navigator.clipboard.writeText(shareUrl);
        setShareToast(shareUrl);
      } catch {
        // Clipboard may be unavailable, still show the link
        setShareToast(shareUrl);
      }

      // Auto-dismiss toast after 5 seconds
      setTimeout(() => setShareToast(null), 5000);
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      setShareToast(`Error: ${apiErr.message || 'Failed to share'}`);
      setTimeout(() => setShareToast(null), 4000);
    } finally {
      setSharing(false);
    }
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
    <Group orientation={isMobile ? "vertical" : "horizontal"} className="editor-layout-container">
      {/* Left: Code editor panel */}
      <Panel defaultSize={50} minSize={20} className="glass-panel editor-panel">
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

          <div className="toolbar-actions">
            {/* Format button */}
            <button
              className="editor-action-btn editor-action-btn--format"
              onClick={handleFormat}
              aria-label="Format code"
              title="Format code (Shift+Alt+F)"
              id="format-code"
            >
              <Sparkles size={12} />
              <span className="editor-action-label">Format</span>
            </button>

            {/* Copy code button */}
            <button
              className="editor-action-btn"
              onClick={handleCopyCode}
              aria-label={codeCopied ? 'Code copied!' : 'Copy code'}
              title={codeCopied ? 'Copied!' : 'Copy code'}
              id="copy-code"
            >
              {codeCopied ? <Check size={12} /> : <Copy size={12} />}
            </button>

            {/* Download code button */}
            <button
              className="editor-action-btn"
              onClick={handleDownload}
              aria-label="Download code"
              title={`Download as ${currentLang.label} file`}
              id="download-code"
            >
              <Download size={12} />
            </button>

            {/* Share button */}
            <button
              className="editor-action-btn editor-action-btn--share"
              onClick={handleShare}
              disabled={sharing}
              aria-label={sharing ? 'Sharing...' : 'Share code'}
              title="Share code as a link"
              id="share-code"
            >
              {sharing ? <Loader2 size={12} className="spinner" /> : <Share2 size={12} />}
              <span className="editor-action-label">Share</span>
            </button>

            <div className="toolbar-divider" aria-hidden="true" />

            {/* Run button */}
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
        </div>

        {/* Code editor */}
        <div
          className="code-area-wrapper"
          onClick={() => setLangOpen(false)}
          role="region"
          aria-label="Code editor"
          ref={editorContainerRef}
        >
          <CodeEditor
            language={language}
            value={code}
            onChange={setCode}
            fontSize={13.5}
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
      </Panel>

      <Separator className="panel-resize-handle">
        <div className="panel-resize-handle-line" />
      </Separator>

      {/* Right: Output panel */}
      <Panel defaultSize={50} minSize={20} className="glass-panel editor-panel">
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
      </Panel>

      {/* Share toast notification */}
      {shareToast && (
        <div className={`share-toast ${shareToast.startsWith('Error') ? 'share-toast--error' : ''}`}>
          {shareToast.startsWith('Error') ? (
            <span className="share-toast-text">{shareToast}</span>
          ) : (
            <>
              <Link size={14} className="share-toast-icon" />
              <div className="share-toast-content">
                <span className="share-toast-label">Link copied to clipboard!</span>
                <span className="share-toast-url">{shareToast}</span>
              </div>
            </>
          )}
          <button
            className="share-toast-close"
            onClick={() => setShareToast(null)}
            aria-label="Dismiss"
          >
            <XCircle size={14} />
          </button>
        </div>
      )}

      {/* Snippet loading overlay */}
      {snippetLoading && (
        <div className="snippet-loading-overlay">
          <Loader2 size={28} className="spinner" />
          <span>Loading shared snippet...</span>
        </div>
      )}

      {/* Snippet error overlay */}
      {snippetError && (
        <div className="snippet-error-overlay">
          <XCircle size={28} />
          <span>{snippetError}</span>
          <button className="snippet-error-btn" onClick={() => { setSnippetError(null); navigate('/'); }}>
            Go to Editor
          </button>
        </div>
      )}
    </Group>
  );
}