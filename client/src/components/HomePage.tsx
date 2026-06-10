import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

export default function HomePage() {
  const terminalRef = useRef<HTMLDivElement>(null);

  // Animate log entries in the hero mockup terminal
  useEffect(() => {
    const logs = [
      '[INFO] Checking firewall rules...',
      '[INFO] Memory limit confirmed: 512Mi.',
      '[INFO] System idle. Ready for next task.',
    ];
    let i = 0;
    const interval = setInterval(() => {
      const container = terminalRef.current;
      if (container && i < logs.length) {
        const logEntry = document.createElement('div');
        logEntry.className = 'flex gap-sm font-code-sm text-code-sm text-on-primary-container';
        const time = new Date().toLocaleTimeString([], { hour12: false });
        logEntry.innerHTML = `<span class="text-outline">${time}</span><span>${logs[i]}</span>`;
        container.appendChild(logEntry);
        container.scrollTop = container.scrollHeight;
        i++;
      }
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-surface text-on-surface">
      {/* TopNavBar */}
      <nav className="flex justify-between items-center px-lg h-12 w-full z-40 bg-surface-container-lowest border-b border-outline-variant fixed top-0 left-0">
        <div className="flex items-center gap-md">
          <span className="font-headline-md text-headline-md text-on-surface font-semibold">Sandboxed Runner</span>
          <div className="hidden md:flex gap-sm ml-xl">
            <a className="font-label-caps text-label-caps text-primary border-b-2 border-primary px-xs py-1 transition-all duration-150" href="#how-it-works">How It Works</a>
            <a className="font-label-caps text-label-caps text-secondary px-xs py-1 hover:text-on-surface transition-all duration-150" href="https://github.com/slash-init/sandboxed-code-runner" target="_blank" rel="noopener noreferrer">GitHub</a>
            <Link className="font-label-caps text-label-caps text-secondary px-xs py-1 hover:text-on-surface transition-all duration-150" to="/about">About</Link>
          </div>
        </div>
        <div className="flex items-center gap-md">
          <div className="hidden md:flex items-center gap-sm">
            <a href="https://github.com/slash-init/sandboxed-code-runner" target="_blank" rel="noopener noreferrer" className="material-symbols-outlined text-secondary hover:text-on-surface transition-all duration-150">code</a>
          </div>
          <Link to="/editor" className="bg-primary text-on-primary px-md py-xs font-label-caps text-label-caps rounded hover:brightness-110 active:opacity-80 transition-all">
            Open Editor
          </Link>
        </div>
      </nav>

      <main className="pt-12">
        {/* Hero Section */}
        <section className="max-w-container-max mx-auto px-lg py-xl grid grid-cols-1 lg:grid-cols-12 gap-lg items-center">
          <div className="lg:col-span-5 flex flex-col gap-md">
            <div className="inline-flex items-center gap-xs px-sm py-1 bg-surface-container-high rounded text-primary font-label-caps text-label-caps w-fit">
              <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
              OPEN SOURCE · SELF-HOSTED
            </div>
            <h1 className="font-display-lg text-display-lg text-on-surface tracking-tight leading-tight lg:text-5xl font-extrabold">
              Execute Untrusted Code Safely
            </h1>
            <p className="font-body-base text-body-base text-on-surface-variant max-w-lg">
              Write and run Python, C++, and JavaScript code directly in your browser. Each execution is sandboxed inside an isolated Docker container with strict resource limits and no network access.
            </p>
            <div className="flex flex-wrap gap-sm mt-md">
              <Link to="/editor" className="bg-primary text-on-primary px-lg py-md rounded-lg font-label-caps text-label-caps flex items-center gap-sm hover:brightness-95 transition-all">
                Open Editor <span className="material-symbols-outlined">play_arrow</span>
              </Link>
              <a href="https://github.com/slash-init/sandboxed-code-runner" target="_blank" rel="noopener noreferrer" className="border border-outline text-on-surface px-lg py-md rounded-lg font-label-caps text-label-caps hover:bg-surface-container-low transition-all flex items-center gap-sm">
                <span className="material-symbols-outlined text-[16px]">code</span> View Source
              </a>
            </div>
          </div>

          {/* Hero Visual: Editor Mockup */}
          <div className="lg:col-span-7 mt-xl lg:mt-0">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden flex flex-col aspect-[16/10]" style={{ boxShadow: '0px 2px 4px rgba(0,0,0,0.08)' }}>
              {/* Editor Header */}
              <div className="bg-surface-container flex items-center justify-between px-md py-sm border-b border-outline-variant">
                <div className="flex items-center gap-sm">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-outline-variant"></div>
                    <div className="w-3 h-3 rounded-full bg-outline-variant"></div>
                    <div className="w-3 h-3 rounded-full bg-outline-variant"></div>
                  </div>
                  <span className="font-code-sm text-code-sm text-on-surface-variant ml-sm">main.py</span>
                </div>
                <div className="flex items-center gap-md">
                  <div className="flex items-center gap-xs px-sm py-0.5 bg-on-tertiary-container rounded border border-tertiary-container">
                    <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse"></span>
                    <span className="font-label-caps text-[10px] text-tertiary">CONTAINER: ISOLATED</span>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant">settings</span>
                </div>
              </div>
              {/* Editor Body */}
              <div className="flex flex-1 overflow-hidden">
                {/* Code Area */}
                <div className="flex-1 flex flex-col font-code-base text-code-base p-md bg-[#ffffff] overflow-auto" style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
                  <div className="flex gap-md opacity-50"><span className="w-4 text-right">1</span><span className="text-primary">import</span> <span>os, sys</span></div>
                  <div className="flex gap-md opacity-50"><span className="w-4 text-right">2</span><span></span></div>
                  <div className="flex gap-md"><span className="w-4 text-right opacity-50">3</span><span className="text-secondary italic"># Testing restricted network access</span></div>
                  <div className="flex gap-md"><span className="w-4 text-right opacity-50">4</span><span className="text-primary">def</span> <span className="text-tertiary">check_safety</span>():</div>
                  <div className="flex gap-md"><span className="w-4 text-right opacity-50">5</span><span className="pl-4 text-primary">try</span>:</div>
                  <div className="flex gap-md"><span className="w-4 text-right opacity-50">6</span><span className="pl-8">print(</span><span className="text-on-secondary-fixed-variant">"Initializing runtime..."</span>)</div>
                  <div className="flex gap-md"><span className="w-4 text-right opacity-50">7</span><span className="pl-8">os.listdir(</span><span className="text-on-secondary-fixed-variant">"/"</span>)</div>
                  <div className="flex gap-md"><span className="w-4 text-right opacity-50">8</span><span className="pl-4 text-primary">except</span> <span className="text-error">PermissionError</span>:</div>
                  <div className="flex gap-md"><span className="w-4 text-right opacity-50">9</span><span className="pl-8 text-primary">print</span>(<span className="text-on-secondary-fixed-variant">"Access denied as expected."</span>)</div>
                </div>
                {/* Metrics Inspector */}
                <div className="w-64 border-l border-outline-variant bg-surface-container-low p-md flex flex-col gap-lg">
                  <div className="flex flex-col gap-sm">
                    <span className="font-label-caps text-label-caps text-secondary">CPU USAGE</span>
                    <div className="h-1 bg-outline-variant rounded-full overflow-hidden"><div className="bg-primary h-full w-[12%]"></div></div>
                    <span className="font-code-sm text-code-sm">12.4% / 2.0 Cores</span>
                  </div>
                  <div className="flex flex-col gap-sm">
                    <span className="font-label-caps text-label-caps text-secondary">MEMORY</span>
                    <div className="h-1 bg-outline-variant rounded-full overflow-hidden"><div className="bg-primary h-full w-[45%]"></div></div>
                    <span className="font-code-sm text-code-sm">230MB / 512MB</span>
                  </div>
                  <div className="mt-auto border-t border-outline-variant pt-md">
                    <div className="flex flex-col gap-xs">
                      <span className="font-label-caps text-label-caps text-secondary">RUNTIME</span>
                      <span className="font-code-base text-code-base text-on-surface">Python 3.11-slim</span>
                    </div>
                  </div>
                </div>
              </div>
              {/* Terminal Footer */}
              <div ref={terminalRef} className="h-24 bg-[#1a1c1c] p-sm overflow-auto" style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
                <div className="flex gap-sm font-code-sm text-code-sm text-on-primary-container">
                  <span className="text-outline">14:02:01</span><span>[INFO] Spawning container x-992...</span>
                </div>
                <div className="flex gap-sm font-code-sm text-code-sm text-[#ffffff]">
                  <span className="text-outline">14:02:01</span><span>Initializing runtime...</span>
                </div>
                <div className="flex gap-sm font-code-sm text-code-sm text-[#ffffff]">
                  <span className="text-outline">14:02:02</span><span>Access denied as expected.</span>
                </div>
                <div className="flex gap-sm font-code-sm text-code-sm text-on-primary-container">
                  <span className="text-outline">14:02:02</span><span>[SUCCESS] Execution finished in 1.2s.</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="how-it-works" className="bg-surface-container-low py-xl border-y border-outline-variant">
          <div className="max-w-container-max mx-auto px-lg">
            <div className="mb-xl">
              <h2 className="font-headline-md text-headline-md text-on-surface">How It Works</h2>
              <div className="w-12 h-1 bg-primary mt-sm"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">
              <div className="bg-surface-container-lowest p-lg border border-outline-variant flex flex-col gap-md group hover:border-primary transition-colors">
                <span className="material-symbols-outlined text-primary text-3xl">terminal</span>
                <h3 className="font-headline-md text-headline-md text-on-surface">Container Isolation</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                  Every execution runs inside a fresh Docker container. No network access, no persistent state, and strict filesystem isolation ensure your code can't escape.
                </p>
              </div>
              <div className="bg-surface-container-lowest p-lg border border-outline-variant flex flex-col gap-md group hover:border-primary transition-colors">
                <span className="material-symbols-outlined text-primary text-3xl">monitoring</span>
                <h3 className="font-headline-md text-headline-md text-on-surface">Resource Enforcement</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                  CPU and memory are capped per execution via cgroups. Runaway processes are terminated automatically when they exceed limits or hit the timeout.
                </p>
              </div>
              <div className="bg-surface-container-lowest p-lg border border-outline-variant flex flex-col gap-md group hover:border-primary transition-colors">
                <span className="material-symbols-outlined text-primary text-3xl">play_circle</span>
                <h3 className="font-headline-md text-headline-md text-on-surface">Real-time Output</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                  See stdout and stderr output as your code runs. Errors, stack traces, and exit codes are captured and displayed inline.
                </p>
              </div>
              <div className="bg-surface-container-lowest p-lg border border-outline-variant flex flex-col gap-md group hover:border-primary transition-colors">
                <span className="material-symbols-outlined text-primary text-3xl">package_2</span>
                <h3 className="font-headline-md text-headline-md text-on-surface">Multi-Language</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                  Write in Python, C++, or JavaScript with full syntax highlighting and autocomplete. Switch languages instantly from the sidebar.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Technical Integration Bento Grid */}
        <section className="max-w-container-max mx-auto px-lg py-xl">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter auto-rows-[240px]">
            {/* Main Integration Card */}
            <div className="md:col-span-8 md:row-span-2 bg-surface-container-lowest border border-outline-variant rounded-xl p-lg flex flex-col">
              <div className="flex justify-between items-start mb-lg">
                <div className="flex flex-col gap-xs">
                  <span className="font-label-caps text-label-caps text-secondary">BACKEND API</span>
                  <h4 className="font-headline-md text-headline-md">Execute via REST</h4>
                </div>
                <span className="bg-surface-container-high px-sm py-1 rounded font-code-sm text-code-sm">POST /run</span>
              </div>
              <div className="flex-1 bg-surface rounded p-md border border-outline-variant overflow-hidden">
                <pre className="font-code-base text-code-base text-on-surface-variant">
{`{
  `}<span className="text-primary">"language"</span>{`: `}<span className="text-on-secondary-fixed-variant">"python"</span>{`,
  `}<span className="text-primary">"code"</span>{`: `}<span className="text-on-secondary-fixed-variant">"print('Hello, World!')"</span>{`,
  `}<span className="text-primary">"input"</span>{`: `}<span className="text-on-secondary-fixed-variant">""</span>{`
}`}
                </pre>
              </div>
              <p className="mt-md font-body-sm text-body-sm text-on-surface-variant">The backend exposes a simple JSON API. Send code, get output — no authentication required for local use.</p>
            </div>
            {/* Stats Card */}
            <div className="md:col-span-4 md:row-span-1 bg-primary text-on-primary rounded-xl p-lg flex flex-col justify-between">
              <span className="material-symbols-outlined text-4xl">language</span>
              <div>
                <div className="font-display-lg text-4xl font-extrabold">3</div>
                <p className="font-label-caps text-label-caps opacity-80 mt-1">SUPPORTED LANGUAGES</p>
              </div>
            </div>
            {/* Status Card */}
            <div className="md:col-span-4 md:row-span-1 bg-surface-container-high border border-outline-variant rounded-xl p-lg flex flex-col justify-between">
              <div className="flex justify-between items-center">
                <span className="font-label-caps text-label-caps text-secondary">TECH STACK</span>
                <span className="material-symbols-outlined text-tertiary">deployed_code</span>
              </div>
              <div>
                <div className="font-headline-md text-headline-md">Node + Docker</div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Express backend, Prisma ORM, Docker containers.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="max-w-container-max mx-auto px-lg py-xl mb-xl">
          <div className="bg-surface-container rounded-xl p-xl flex flex-col items-center text-center gap-md border border-outline-variant">
            <h2 className="font-display-lg text-display-lg font-extrabold max-w-2xl">Start writing code now</h2>
            <p className="font-body-base text-body-base text-on-surface-variant max-w-xl">
              No sign-up required. Open the editor, pick a language, and run your code instantly in a sandboxed environment.
            </p>
            <div className="flex gap-md mt-md">
              <Link to="/editor" className="bg-primary text-on-primary px-xl py-md rounded-lg font-label-caps text-label-caps hover:brightness-110 transition-all">
                Open Editor
              </Link>
              <a href="https://github.com/slash-init/sandboxed-code-runner" target="_blank" rel="noopener noreferrer" className="border border-outline text-on-surface px-xl py-md rounded-lg font-label-caps text-label-caps hover:bg-surface-container-low transition-all">
                View on GitHub
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="flex justify-between items-center w-full bg-surface-container h-8 py-xs px-md border-t border-outline-variant">
        <div className="font-code-sm text-code-sm text-on-surface-variant opacity-70">
          Sandboxed Runner — Open Source
        </div>
        <div className="flex gap-md">
          <a className="font-code-sm text-code-sm text-on-surface-variant opacity-70 hover:opacity-100 hover:underline transition-opacity" href="https://github.com/slash-init/sandboxed-code-runner" target="_blank" rel="noopener noreferrer">GitHub</a>
          <Link to="/editor" className="font-code-sm text-code-sm text-on-surface-variant opacity-70 hover:opacity-100 hover:underline transition-opacity">Editor</Link>
        </div>
      </footer>
    </div>
  );
}
