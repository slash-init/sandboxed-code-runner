import { useState } from 'react';
import CodeEditor from '@uiw/react-textarea-code-editor';
import { Play, Loader2, Terminal, ChevronDown, Cpu, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import axios from 'axios';

const API_BASE = 'http://localhost:3000';

const LANGUAGES = [
  { value: 'python', label: 'Python', ext: '.py' },
  { value: 'cpp', label: 'C++', ext: '.cpp' },
];

const DEFAULT_CODE: Record<string, string> = {
  python: `def greet(name: str) -> str:\n    return f"Hello, {name}!"\n\nprint(greet("World"))`,
  cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}`,
};

export default function Editor() {
  const [code, setCode] = useState(DEFAULT_CODE['python']);
  const [language, setLanguage] = useState<'python' | 'cpp'>('python');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  const handleLangChange = (val: 'python' | 'cpp') => {
    setLanguage(val);
    setCode(DEFAULT_CODE[val]);
    setLangOpen(false);
    setOutput('');
    setStatus('');
  };

  const handleRun = async () => {
    setLoading(true);
    setOutput('');
    setStatus('');
    try {
      const res = await axios.post(`${API_BASE}/run`, { language, code, input });
      setOutput(res.data.stdout + (res.data.stderr ? '\n[stderr]\n' + res.data.stderr : ''));
      setStatus(res.data.status.toUpperCase());
    } catch (err: any) {
      setOutput(err.response?.data?.message || err.message);
      setStatus('ERROR');
    } finally {
      setLoading(false);
    }
  };

  const currentLang = LANGUAGES.find(l => l.value === language)!;

  const statusConfig: Record<string, { icon: any; color: string; glow: string; bg: string }> = {
    SUCCESS: {
      icon: CheckCircle2,
      color: '#4ade80',
      glow: 'rgba(74,222,128,0.15)',
      bg: 'rgba(74,222,128,0.08)',
    },
    ERROR: {
      icon: XCircle,
      color: '#f87171',
      glow: 'rgba(248,113,113,0.15)',
      bg: 'rgba(248,113,113,0.08)',
    },
    TIMEOUT: {
      icon: AlertTriangle,
      color: '#fb923c',
      glow: 'rgba(251,146,60,0.15)',
      bg: 'rgba(251,146,60,0.08)',
    },
  };

  const sc = status ? statusConfig[status] ?? statusConfig['ERROR'] : null;
  const StatusIcon = sc?.icon;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500&family=Syne:wght@400;600;700&display=swap');

        * { box-sizing: border-box; }

        body {
          margin: 0;
          background: #050507;
          min-height: 100vh;
        }

        #root {
          width: 100% !important;
          max-width: 100% !important;
          border: none !important;
        }

        .editor-root {
          min-height: 100svh;
          background: #050507;
          background-image:
            radial-gradient(ellipse 80% 50% at 20% -10%, rgba(99,60,200,0.18) 0%, transparent 60%),
            radial-gradient(ellipse 60% 40% at 85% 110%, rgba(30,180,120,0.10) 0%, transparent 55%);
          font-family: 'Syne', sans-serif;
          padding: 32px 24px 48px;
        }

        .glass {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          backdrop-filter: blur(12px);
        }

        .glass-deep {
          background: rgba(0,0,0,0.45);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 12px;
          backdrop-filter: blur(20px);
        }

        /* Header */
        .header {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 32px;
        }

        .header-icon {
          width: 42px;
          height: 42px;
          border-radius: 10px;
          background: linear-gradient(135deg, rgba(120,80,255,0.5), rgba(40,160,120,0.3));
          border: 1px solid rgba(120,80,255,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .header h1 {
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 22px;
          color: #f0eeff;
          margin: 0;
          letter-spacing: -0.3px;
        }

        .header p {
          font-size: 12px;
          color: rgba(255,255,255,0.3);
          margin: 0;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          font-weight: 400;
        }

        /* Toolbar */
        .toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 14px;
          background: rgba(0,0,0,0.3);
          border-bottom: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px 16px 0 0;
        }

        .toolbar-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        /* Dots */
        .dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }

        /* Lang dropdown */
        .lang-dropdown {
          position: relative;
        }

        .lang-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          padding: 5px 10px;
          color: rgba(255,255,255,0.85);
          font-family: 'Geist Mono', monospace;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.15s;
          outline: none;
        }

        .lang-btn:hover {
          background: rgba(255,255,255,0.1);
          border-color: rgba(255,255,255,0.18);
        }

        .lang-menu {
          position: absolute;
          top: calc(100% + 6px);
          left: 0;
          min-width: 130px;
          background: rgba(12,10,20,0.96);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 10px;
          overflow: hidden;
          z-index: 100;
          backdrop-filter: blur(20px);
          box-shadow: 0 16px 40px rgba(0,0,0,0.6);
        }

        .lang-option {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 9px 14px;
          font-family: 'Geist Mono', monospace;
          font-size: 12px;
          color: rgba(255,255,255,0.7);
          cursor: pointer;
          transition: background 0.12s;
        }

        .lang-option:hover {
          background: rgba(255,255,255,0.07);
          color: #fff;
        }

        .lang-option.active {
          color: #a78bfa;
        }

        .lang-ext {
          font-size: 11px;
          color: rgba(255,255,255,0.3);
        }

        /* Run button */
        .run-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background: linear-gradient(135deg, #6d28d9, #4f46e5);
          border: 1px solid rgba(167,139,250,0.3);
          border-radius: 9px;
          padding: 7px 18px;
          color: #fff;
          font-family: 'Syne', sans-serif;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.18s;
          outline: none;
          letter-spacing: 0.2px;
          box-shadow: 0 0 20px rgba(109,40,217,0.3);
        }

        .run-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #7c3aed, #6366f1);
          box-shadow: 0 0 30px rgba(109,40,217,0.5);
          transform: translateY(-1px);
        }

        .run-btn:active:not(:disabled) {
          transform: translateY(0);
        }

        .run-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Code area */
        .code-area-wrapper {
          overflow: auto;
          min-height: 380px;
          max-height: 480px;
        }

        .w-tc-editor {
          min-height: 380px !important;
          background: transparent !important;
        }

        .w-tc-editor,
        .w-tc-editor > div,
        .w-tc-editor textarea,
        .w-tc-editor pre,
        .w-tc-editor code {
          background: transparent !important;
          background-color: transparent !important;
        }

        .w-tc-editor textarea, .w-tc-editor pre, .w-tc-editor code {
          font-family: 'Geist Mono', monospace !important;
          font-size: 13.5px !important;
          line-height: 1.7 !important;
        }

        .w-tc-editor textarea {
          color: rgba(255,255,255,0.85) !important;
          caret-color: #a78bfa !important;
        }

        /* Section labels */
        .section-label {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 11px;
          font-weight: 600;
          color: rgba(255,255,255,0.3);
          text-transform: uppercase;
          letter-spacing: 0.8px;
          margin-bottom: 8px;
        }

        /* Stdin */
        .stdin-area {
          width: 100%;
          background: rgba(0,0,0,0.3);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 10px;
          padding: 10px 14px;
          color: rgba(255,255,255,0.8);
          font-family: 'Geist Mono', monospace;
          font-size: 12.5px;
          resize: vertical;
          outline: none;
          line-height: 1.6;
          transition: border-color 0.15s;
          min-height: 70px;
        }

        .stdin-area::placeholder {
          color: rgba(255,255,255,0.2);
        }

        .stdin-area:focus {
          border-color: rgba(167,139,250,0.4);
        }

        /* Output */
        .output-pre {
          flex: 1;
          font-family: 'Geist Mono', monospace;
          font-size: 12.5px;
          line-height: 1.75;
          color: rgba(255,255,255,0.75);
          white-space: pre-wrap;
          word-break: break-word;
          padding: 0;
          margin: 0;
          min-height: 200px;
        }

        .output-empty {
          color: rgba(255,255,255,0.2);
          font-style: italic;
        }

        /* Status badge */
        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-family: 'Geist Mono', monospace;
          font-size: 11px;
          font-weight: 500;
          padding: 4px 10px;
          border-radius: 6px;
          letter-spacing: 0.5px;
        }

        /* Main grid */
        .main-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          align-items: start;
        }

        @media (max-width: 900px) {
          .main-grid {
            grid-template-columns: 1fr;
          }
        }

        /* Scrollbar */
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}</style>

      <div className="editor-root">
        {/* Header */}
        <div className="header">
          <div className="header-icon">
            <Cpu size={20} color="#c4b5fd" />
          </div>
          <div>
            <h1>Code Runner</h1>
            <p>Sandboxed · Isolated · Real-time</p>
          </div>
        </div>

        <div className="main-grid">
          {/* Left: Editor panel */}
          <div className="glass" style={{ overflow: 'hidden' }}>
            {/* Toolbar */}
            <div className="toolbar">
              <div className="toolbar-left">
                {/* Traffic lights */}
                <div style={{ display: 'flex', gap: '6px', marginRight: '6px' }}>
                  <div className="dot" style={{ background: '#ff5f57' }} />
                  <div className="dot" style={{ background: '#febc2e' }} />
                  <div className="dot" style={{ background: '#28c840' }} />
                </div>

                {/* Language selector */}
                <div className="lang-dropdown">
                  <button className="lang-btn" onClick={() => setLangOpen(o => !o)}>
                    {currentLang.label}
                    <ChevronDown size={12} style={{ opacity: 0.6, transform: langOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.15s' }} />
                  </button>
                  {langOpen && (
                    <div className="lang-menu">
                      {LANGUAGES.map(l => (
                        <div
                          key={l.value}
                          className={`lang-option ${l.value === language ? 'active' : ''}`}
                          onClick={() => handleLangChange(l.value as 'python' | 'cpp')}
                        >
                          {l.label}
                          <span className="lang-ext">{l.ext}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <button className="run-btn" onClick={handleRun} disabled={loading}>
                {loading
                  ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />Running</>
                  : <><Play size={15} />Run</>
                }
              </button>
            </div>

            {/* Code editor */}
            <div className="code-area-wrapper" onClick={() => setLangOpen(false)}>
              <CodeEditor
                value={code}
                language={language === 'python' ? 'python' : 'cpp'}
                onChange={(e) => setCode(e.target.value)}
                data-color-mode="dark"
                padding={16}
                style={{
                  backgroundColor: 'transparent',
                  fontSize: 13.5,
                  fontFamily: "'Geist Mono', monospace",
                  minHeight: 380,
                  lineHeight: 1.7,
                }}
              />
            </div>

            {/* Stdin */}
            <div style={{ padding: '14px 16px 16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="section-label">
                <Terminal size={12} />
                stdin
              </div>
              <textarea
                className="stdin-area"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Optional input..."
                rows={3}
              />
            </div>
          </div>

          {/* Right: Output panel */}
          <div className="glass" style={{ overflow: 'hidden' }}>
            {/* Output toolbar */}
            <div className="toolbar" style={{ borderRadius: '16px 16px 0 0' }}>
              <div className="section-label" style={{ margin: 0 }}>
                <Terminal size={12} />
                output
              </div>
              {sc && StatusIcon && (
                <div
                  className="status-badge"
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
            </div>

            {/* Output content */}
            <div style={{ padding: '16px', minHeight: '460px', display: 'flex', flexDirection: 'column' }}>
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
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}