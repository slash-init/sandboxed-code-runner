import { useState, useCallback, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CodeEditor, { getEditorInstance } from './components/CodeEditor';
import { runCode, saveSnippet, getSnippet, healthCheck, type RunResponse, type ApiError } from './lib/api';
import './App.css';

type Language = 'python' | 'cpp' | 'javascript';

const LANGUAGES = [
  { value: 'python' as const, label: 'Python', ext: '.py', monacoId: 'python' },
  { value: 'cpp' as const, label: 'C++', ext: '.cpp', monacoId: 'cpp' },
  { value: 'javascript' as const, label: 'JavaScript', ext: '.js', monacoId: 'javascript' },
];

const DEFAULT_CODE: Record<string, string> = {
  python: `def greet(name: str) -> str:\n    return f"Hello, {name}!"\n\nprint(greet("World"))`,
  cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}`,
  javascript: `function greet(name) {\n  return \`Hello, \${name}!\`;\n}\n\nconsole.log(greet("World"));`,
};

function App() {
  const { snippetId } = useParams<{ snippetId?: string }>();
  const navigate = useNavigate();

  const [code, setCode] = useState(DEFAULT_CODE['python']);
  const [language, setLanguage] = useState<Language>('python');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [execTimeMs, setExecTimeMs] = useState<number | null>(null);
  const [connected, setConnected] = useState<boolean | null>(null);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [outputTab, setOutputTab] = useState<'output' | 'logs' | 'errors'>('output');
  const [sharing, setSharing] = useState(false);
  const [shareToast, setShareToast] = useState<string | null>(null);

  const editorContainerRef = useRef<HTMLDivElement>(null);
  const paletteRef = useRef<HTMLDivElement>(null);
  const paletteInputRef = useRef<HTMLInputElement>(null);

  // Health check
  useEffect(() => {
    let mounted = true;
    const check = async () => {
      const ok = await healthCheck();
      if (mounted) setConnected(ok);
    };
    check();
    const interval = setInterval(check, 15000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  // Load snippet
  useEffect(() => {
    if (!snippetId) return;
    let cancelled = false;
    getSnippet(snippetId)
      .then((snippet) => {
        if (cancelled) return;
        setCode(snippet.code);
        setLanguage(snippet.language as Language);
        setInput(snippet.input || '');
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [snippetId]);

  // Command palette keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setCommandPaletteOpen(false);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleRun();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  });

  // Close palette on outside click
  useEffect(() => {
    if (!commandPaletteOpen) return;
    const handler = (e: MouseEvent) => {
      if (paletteRef.current && !paletteRef.current.contains(e.target as Node)) {
        setCommandPaletteOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [commandPaletteOpen]);

  // Focus palette input
  useEffect(() => {
    if (commandPaletteOpen && paletteInputRef.current) {
      paletteInputRef.current.focus();
    }
  }, [commandPaletteOpen]);

  const handleLangChange = (val: Language) => {
    setLanguage(val);
    setCode(DEFAULT_CODE[val]);
    setOutput('');
    setStatus('');
    setExecTimeMs(null);
  };

  const handleRun = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    setOutput('');
    setStatus('');
    setOutputTab('output');
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

  const handleShare = async () => {
    if (sharing) return;
    setSharing(true);
    try {
      const { id } = await saveSnippet({ language, code, input });
      const shareUrl = `${window.location.origin}/s/${id}`;
      navigate(`/s/${id}`, { replace: true });
      try { await navigator.clipboard.writeText(shareUrl); } catch {}
      setShareToast(shareUrl);
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
  const codeLines = code.split('\n');
  const statusLabel = status === 'SUCCESS' ? 'Success' : status === 'ERROR' || status === 'RUNTIME_ERROR' ? 'Error' : status === 'TIMEOUT' ? 'Timeout' : '';
  const statusColor = status === 'SUCCESS' ? 'bg-[#e7f3eb] text-[#146c2e]' : 'bg-error-container text-on-error-container';

  const outputLines = output ? output.split('\n') : [];
  const stderrLines = outputLines.filter(l => l.startsWith('[stderr]') || (outputLines.indexOf('[stderr]') !== -1 && outputLines.indexOf(l) > outputLines.indexOf('[stderr]')));
  const stdoutLines = outputLines.filter(l => !stderrLines.includes(l));

  return (
    <>
      {/* Top Navigation Bar */}
      <header className="flex justify-between items-center px-lg h-12 w-full z-40 bg-surface-container-lowest border-b border-outline-variant">
        <div className="flex items-center gap-md">
          <span className="font-headline-md text-headline-md text-on-surface font-semibold">Sandboxed Runner</span>
          <nav className="hidden md:flex gap-md ml-xl">
            <a className="font-label-caps text-label-caps text-secondary transition-all duration-150 hover:text-on-surface" href="#">Docs</a>
            <a className="font-label-caps text-label-caps text-secondary transition-all duration-150 hover:text-on-surface" href="#">Changelog</a>
            <a className="font-label-caps text-label-caps text-secondary transition-all duration-150 hover:text-on-surface" href="#">API</a>
          </nav>
        </div>
        <div className="flex items-center gap-md">
          <div className="relative flex items-center bg-surface-container-low px-sm py-xs rounded border border-outline-variant">
            <span className="material-symbols-outlined text-outline mr-xs">search</span>
            <input className="bg-transparent border-none focus:ring-0 text-body-sm font-body-sm w-48 py-0" placeholder="Search resources..." type="text" />
            <span className="text-[10px] font-code-sm bg-surface-container-high px-1 rounded text-outline border border-outline-variant">⌘K</span>
          </div>
          <button onClick={handleShare} disabled={sharing} className="bg-primary text-on-primary px-md py-xs text-label-caps font-label-caps rounded transition-all hover:bg-primary-container hover:text-on-primary-container">
            {sharing ? 'Sharing...' : 'Share Snippet'}
          </button>
          <div className="flex items-center gap-xs ml-sm">
            <span className="material-symbols-outlined text-secondary cursor-pointer hover:text-on-surface">notifications</span>
            <span className="material-symbols-outlined text-secondary cursor-pointer hover:text-on-surface">help_outline</span>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-48px-32px)] overflow-hidden">
        {/* Sidebar */}
        <aside className="h-full w-64 border-r border-outline-variant bg-surface flex flex-col shrink-0">
          <div className="p-md border-b border-outline-variant flex flex-col gap-xs">
            <span className="font-label-caps text-[10px] text-outline uppercase tracking-widest">Active Language</span>
            <div className="flex items-center justify-between">
              <span className="font-headline-md text-headline-md text-primary font-bold">{currentLang.label}</span>
              <span className="material-symbols-outlined text-outline">unfold_more</span>
            </div>
          </div>
          <nav className="flex-1 overflow-y-auto py-sm">
            {LANGUAGES.map(l => (
              <div className="px-sm mb-xs" key={l.value}>
                <div
                  onClick={() => handleLangChange(l.value)}
                  className={`flex items-center gap-sm px-md py-sm cursor-pointer rounded transition-colors ${
                    l.value === language
                      ? 'bg-secondary-container text-on-secondary-container border-l-2 border-primary'
                      : 'hover:bg-surface-container-low text-on-surface-variant'
                  }`}
                >
                  <span className="material-symbols-outlined">
                    {l.value === 'python' ? 'code' : l.value === 'cpp' ? 'memory' : 'javascript'}
                  </span>
                  <span className="font-body-sm text-body-sm">{l.label}</span>
                  <span className="ml-auto font-code-sm text-code-sm text-outline">{l.ext}</span>
                </div>
              </div>
            ))}
            <div className="px-sm mt-md">
              <div className="px-md py-xs">
                <span className="font-label-caps text-[10px] text-outline uppercase tracking-widest">Tools</span>
              </div>
            </div>
            <div className="px-sm mb-xs">
              <div className="flex items-center gap-sm px-md py-sm cursor-pointer rounded transition-colors hover:bg-surface-container-low text-on-surface-variant">
                <span className="material-symbols-outlined">vpn_key</span>
                <span className="font-body-sm text-body-sm">Secrets</span>
              </div>
            </div>
            <div className="px-sm mb-xs">
              <div className="flex items-center gap-sm px-md py-sm cursor-pointer rounded transition-colors hover:bg-surface-container-low text-on-surface-variant">
                <span className="material-symbols-outlined">monitoring</span>
                <span className="font-body-sm text-body-sm">Analytics</span>
              </div>
            </div>
          </nav>
          <div className="p-sm border-t border-outline-variant bg-surface-container-low">
            <div className="flex items-center gap-sm px-md py-xs cursor-pointer hover:underline text-on-surface-variant opacity-70">
              <span className="material-symbols-outlined text-sm">settings</span>
              <span className="font-body-sm text-body-sm">Settings</span>
            </div>
            <div className="flex items-center gap-sm px-md py-xs cursor-pointer hover:underline text-on-surface-variant opacity-70">
              <span className="material-symbols-outlined text-sm">menu_book</span>
              <span className="font-body-sm text-body-sm">Documentation</span>
            </div>
          </div>
        </aside>

        {/* Main Workspace Area */}
        <main className="flex-1 flex flex-col min-w-0 bg-surface-container-lowest relative">
          {/* Editor Tabs */}
          <div className="h-9 flex items-center bg-surface border-b border-outline-variant">
            <div className="flex h-full items-center px-md border-r border-outline-variant bg-surface-container-highest text-on-surface font-code-sm text-code-sm border-b-2 border-primary">
              <span className="material-symbols-outlined text-sm mr-sm">data_object</span>
              main{currentLang.ext}
              <span className="material-symbols-outlined text-xs ml-md hover:text-error cursor-pointer">close</span>
            </div>
            <div className="flex-1 h-full"></div>
            <div className="flex items-center px-md gap-sm">
              <span className="material-symbols-outlined text-secondary cursor-pointer hover:text-primary" onClick={() => setCommandPaletteOpen(true)}>more_vert</span>
            </div>
          </div>

          {/* Code Editor Surface */}
          <div className="flex-1 flex overflow-hidden" ref={editorContainerRef}>
            <div className="flex-1 overflow-auto custom-scrollbar bg-surface-container-lowest">
              <CodeEditor
                language={language}
                value={code}
                onChange={setCode}
                fontSize={13}
              />
            </div>

            {/* Command Palette */}
            {commandPaletteOpen && (
              <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] bg-surface border border-outline shadow-xl z-50 rounded-lg" ref={paletteRef}>
                <div className="p-md border-b border-outline-variant flex items-center gap-sm">
                  <span className="material-symbols-outlined text-primary">terminal</span>
                  <input ref={paletteInputRef} className="w-full bg-transparent border-none focus:ring-0 font-code-base text-code-base" placeholder="Run command..." type="text" />
                </div>
                <div className="max-h-64 overflow-y-auto p-xs">
                  <div className="flex items-center justify-between p-sm hover:bg-surface-container-high rounded cursor-pointer group" onClick={() => { setCommandPaletteOpen(false); handleRun(); }}>
                    <div className="flex items-center gap-sm">
                      <span className="material-symbols-outlined text-outline">rocket_launch</span>
                      <span className="text-body-sm">Execute: main{currentLang.ext}</span>
                    </div>
                    <span className="text-[10px] text-outline opacity-0 group-hover:opacity-100 font-code-sm">⌘↵</span>
                  </div>
                  <div className="flex items-center justify-between p-sm hover:bg-surface-container-high rounded cursor-pointer group" onClick={() => { setCommandPaletteOpen(false); handleShare(); }}>
                    <div className="flex items-center gap-sm">
                      <span className="material-symbols-outlined text-outline">share</span>
                      <span className="text-body-sm">Share Snippet</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-sm hover:bg-surface-container-high rounded cursor-pointer group border-t border-outline-variant mt-xs pt-sm" onClick={() => { setCommandPaletteOpen(false); setOutput(''); setStatus(''); setExecTimeMs(null); }}>
                    <div className="flex items-center gap-sm text-error">
                      <span className="material-symbols-outlined">restart_alt</span>
                      <span className="text-body-sm">Clear Output</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Terminal / Output Area */}
          <div className="h-48 border-t border-outline-variant bg-surface flex flex-col">
            <div className="flex items-center px-md py-1 border-b border-outline-variant bg-surface-container-low gap-md">
              <span onClick={() => setOutputTab('output')} className={`font-label-caps text-label-caps cursor-pointer ${outputTab === 'output' ? 'text-primary border-b border-primary' : 'text-secondary opacity-60 hover:opacity-100'}`}>Output</span>
              <span onClick={() => setOutputTab('logs')} className={`font-label-caps text-label-caps cursor-pointer ${outputTab === 'logs' ? 'text-primary border-b border-primary' : 'text-secondary opacity-60 hover:opacity-100'}`}>Logs</span>
              <span onClick={() => setOutputTab('errors')} className={`font-label-caps text-label-caps cursor-pointer flex items-center ${outputTab === 'errors' ? 'text-primary border-b border-primary' : 'text-secondary opacity-60 hover:opacity-100'}`}>
                Errors {(status === 'ERROR' || status === 'RUNTIME_ERROR') && <span className="w-1.5 h-1.5 bg-error rounded-full ml-1"></span>}
              </span>
              <div className="flex-1"></div>
              <span className="material-symbols-outlined text-sm cursor-pointer hover:text-error" onClick={() => { setOutput(''); setStatus(''); setExecTimeMs(null); }}>block</span>
            </div>
            <div className="flex-1 p-md font-code-sm text-code-sm overflow-auto custom-scrollbar bg-surface-dim/20">
              {loading ? (
                <>
                  <div className="text-secondary opacity-80 mb-xs">[{new Date().toLocaleTimeString()}] Initializing execution sandbox...</div>
                  <div className="text-secondary opacity-80 mb-xs">[{new Date().toLocaleTimeString()}] Compiling {currentLang.label} source...</div>
                  <div className="mt-md flex items-center text-outline animate-pulse">
                    <span className="mr-sm">$</span>
                    <span className="w-2 h-4 bg-outline"></span>
                  </div>
                </>
              ) : output ? (
                <>
                  {execTimeMs !== null && (
                    <div className="text-primary-container font-bold mb-xs">[exec] Build completed in {execTimeMs}ms</div>
                  )}
                  {stdoutLines.map((line, i) => (
                    <div key={i} className="text-on-surface mb-xs">{line}</div>
                  ))}
                  {status === 'SUCCESS' && (
                    <div className="text-tertiary-container mt-xs">[exec] Process exited with code 0.</div>
                  )}
                  {(status === 'ERROR' || status === 'RUNTIME_ERROR') && stderrLines.length > 0 && (
                    <div className="text-error mt-xs">{stderrLines.join('\n')}</div>
                  )}
                  <div className="mt-md flex items-center text-outline animate-pulse">
                    <span className="mr-sm">$</span>
                    <span className="w-2 h-4 bg-outline"></span>
                  </div>
                </>
              ) : (
                <div className="mt-md flex items-center text-outline animate-pulse">
                  <span className="mr-sm">$</span>
                  <span className="w-2 h-4 bg-outline"></span>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Right Observability Panel */}
        <aside className="w-72 h-full border-l border-outline-variant bg-surface flex flex-col shrink-0">
          <div className="p-md border-b border-outline-variant">
            <div className="flex items-center justify-between mb-sm">
              <span className="font-label-caps text-label-caps text-secondary">Execution Status</span>
              {statusLabel && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${statusColor}`}>{statusLabel}</span>
              )}
            </div>
            <div className="flex items-center justify-between text-body-sm font-code-sm">
              <span className="text-outline">Container State</span>
              <span className="text-on-surface">{loading ? 'Running' : status ? 'Terminated' : 'Idle'}</span>
            </div>
          </div>

          <div className="p-md space-y-md overflow-y-auto custom-scrollbar">
            <span className="font-label-caps text-[10px] text-outline uppercase tracking-widest">Metrics</span>
            {/* Runtime */}
            <div className="bg-surface-container-low p-sm border border-outline-variant">
              <div className="flex items-center justify-between mb-xs">
                <span className="text-body-sm font-body-sm">Runtime</span>
                <span className="font-code-base text-primary">{execTimeMs !== null ? `${execTimeMs}ms` : '—'}</span>
              </div>
              <div className="h-1 bg-surface-container-high w-full">
                <div className="h-1 bg-primary transition-all duration-500" style={{ width: execTimeMs ? `${Math.min((execTimeMs / 2000) * 100, 100)}%` : '0%' }}></div>
              </div>
            </div>

            {/* Language */}
            <div className="bg-surface-container-low p-sm border border-outline-variant">
              <div className="flex items-center justify-between mb-xs">
                <span className="text-body-sm font-body-sm">Language</span>
                <span className="font-code-base text-on-surface">{currentLang.label}</span>
              </div>
            </div>

            {/* Code stats */}
            <div className="bg-surface-container-low p-sm border border-outline-variant">
              <div className="flex items-center justify-between mb-xs">
                <span className="text-body-sm font-body-sm">Lines</span>
                <span className="font-code-base text-on-surface">{codeLines.length}</span>
              </div>
              <div className="h-1 bg-surface-container-high w-full">
                <div className="h-1 bg-outline w-1/3"></div>
              </div>
            </div>

            {/* Stdin */}
            <div className="pt-md">
              <span className="font-label-caps text-[10px] text-outline uppercase tracking-widest mb-sm block">Standard Input</span>
              <textarea
                className="w-full bg-surface-container-low border border-outline-variant rounded p-sm font-code-sm text-code-sm text-on-surface resize-none focus:ring-1 focus:ring-primary focus:border-primary"
                rows={3}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Optional stdin..."
              />
            </div>

            {/* Connection status */}
            <div className="pt-md">
              <div className={`p-md border rounded ${connected ? 'bg-[#e7f3eb]/30 border-[#146c2e]/30' : connected === false ? 'bg-error-container/30 border-error/30' : 'bg-surface-container-low border-outline-variant'}`}>
                <div className="flex items-center gap-sm mb-xs">
                  <span className="material-symbols-outlined text-sm">{connected ? 'cloud_done' : connected === false ? 'cloud_off' : 'cloud_sync'}</span>
                  <span className="text-xs font-bold font-label-caps">{connected ? 'Backend Connected' : connected === false ? 'Backend Offline' : 'Checking...'}</span>
                </div>
                <p className="text-[11px] leading-tight text-on-surface-variant">
                  {connected ? 'Sandboxed execution environment is ready.' : connected === false ? 'Cannot reach the execution backend.' : 'Verifying connection...'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex-1"></div>
          <div className="p-md border-t border-outline-variant bg-surface-container-lowest">
            <button
              onClick={handleRun}
              disabled={loading}
              className="w-full bg-primary text-on-primary py-sm font-label-caps text-label-caps rounded flex items-center justify-center gap-sm transition-all active:scale-95 shadow-sm hover:shadow-md disabled:opacity-60"
              id="executeBtn"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined animate-spin">refresh</span>
                  EXECUTING...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">play_arrow</span>
                  EXECUTE
                </>
              )}
            </button>
          </div>
        </aside>
      </div>

      {/* Footer Status Bar */}
      <footer className="flex justify-between items-center w-full bg-surface-container h-8 px-md border-t border-outline-variant z-50">
        <div className="flex items-center gap-md font-code-sm text-code-sm text-on-surface-variant opacity-70">
          <span className="flex items-center gap-xs">
            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-[#146c2e]' : connected === false ? 'bg-error' : 'bg-outline animate-pulse'}`}></span>
            {connected ? 'Connected' : connected === false ? 'Disconnected' : 'Checking...'}
          </span>
          {execTimeMs !== null && (
            <span className="flex items-center gap-xs">
              <span className="material-symbols-outlined text-sm">schedule</span>
              Last run: {execTimeMs}ms
            </span>
          )}
        </div>
        <div className="flex items-center gap-md font-code-sm text-code-sm text-on-surface-variant opacity-70">
          <span className="font-code-base text-code-base">{currentLang.label} {currentLang.ext}</span>
          <span className="font-code-base text-code-base text-primary">Sandboxed Runner v1.0</span>
        </div>
      </footer>

      {/* Share toast */}
      {shareToast && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-inverse-surface text-inverse-on-surface px-md py-sm rounded-lg shadow-xl z-50 flex items-center gap-sm font-code-sm text-code-sm">
          {shareToast.startsWith('Error') ? (
            <span>{shareToast}</span>
          ) : (
            <>
              <span className="material-symbols-outlined text-sm">link</span>
              <span>Link copied!</span>
            </>
          )}
          <button onClick={() => setShareToast(null)} className="ml-sm material-symbols-outlined text-sm hover:text-error">close</button>
        </div>
      )}
    </>
  );
}

export default App;