import { Link } from 'react-router-dom';

const highlights = [
  {
    title: 'What this project is',
    body: 'Sandboxed Runner is a browser-based code execution environment for Python, C++, and JavaScript. It is designed for local development, demos, workshops, and safe experimentation with untrusted snippets.',
  },
  {
    title: 'How isolation works',
    body: 'Each run is launched inside an isolated Docker container with strict resource limits. Network access is disabled, runtime state is not persisted between runs, and the execution environment is intentionally minimal.',
  },
  {
    title: 'Why it exists',
    body: 'The goal is to make code execution feel fast and approachable without sacrificing containment. You can test ideas, inspect output, and share snippets without setting up a full remote environment.',
  },
];

const details = [
  'Runs Python, C++, and JavaScript from the same interface',
  'Returns stdout, stderr, exit status, and timing information',
  'Supports snippet sharing for quick collaboration',
  'Uses a simple JSON API so the backend can be integrated elsewhere',
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <header className="sticky top-0 z-40 border-b border-outline-variant bg-surface-container-lowest/95 backdrop-blur">
        <div className="mx-auto flex max-w-container-max items-center justify-between px-lg h-12">
          <div className="flex items-center gap-md">
            <Link to="/" className="font-headline-md text-headline-md font-semibold text-on-surface hover:text-primary transition-colors">
              Sandboxed Runner
            </Link>
            <span className="hidden md:inline font-label-caps text-label-caps text-secondary">About</span>
          </div>
          <div className="flex items-center gap-sm">
            <Link to="/" className="font-label-caps text-label-caps text-secondary px-sm py-1 hover:text-on-surface transition-colors">
              Home
            </Link>
            <Link to="/editor" className="bg-primary text-on-primary px-md py-xs font-label-caps text-label-caps rounded hover:brightness-110 active:opacity-80 transition-all">
              Open Editor
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden border-b border-outline-variant">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(76,85,255,0.12),transparent_32%),radial-gradient(circle_at_left,rgba(0,153,116,0.10),transparent_28%)]"></div>
          <div className="relative mx-auto max-w-container-max px-lg py-16 md:py-20">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-xs rounded-full border border-outline-variant bg-surface-container-low px-sm py-1 font-label-caps text-label-caps text-secondary">
                <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
                PROJECT OVERVIEW
              </div>
              <h1 className="mt-md font-display-lg text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-on-surface">
                Built for safe, simple code execution.
              </h1>
              <p className="mt-md max-w-2xl font-body-base text-body-base text-on-surface-variant leading-relaxed">
                This app combines a lightweight editor experience with containerized execution so you can explore ideas without exposing your machine to arbitrary code.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-container-max px-lg py-xl">
          <div className="grid grid-cols-1 gap-gutter lg:grid-cols-3">
            {highlights.map((item) => (
              <article key={item.title} className="rounded-xl border border-outline-variant bg-surface-container-lowest p-lg shadow-sm">
                <h2 className="font-headline-md text-headline-md text-on-surface">{item.title}</h2>
                <p className="mt-sm font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                  {item.body}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="border-y border-outline-variant bg-surface-container-low py-xl">
          <div className="mx-auto grid max-w-container-max grid-cols-1 gap-xl px-lg lg:grid-cols-12">
            <div className="lg:col-span-7">
              <h2 className="font-headline-md text-headline-md text-on-surface">What you can do with it</h2>
              <ul className="mt-lg grid grid-cols-1 gap-sm">
                {details.map((detail) => (
                  <li key={detail} className="flex items-start gap-sm rounded-lg border border-outline-variant bg-surface-container-lowest px-md py-sm">
                    <span className="material-symbols-outlined text-primary text-[20px] mt-0.5">check_circle</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">{detail}</span>
                  </li>
                ))}
              </ul>
            </div>

            <aside className="lg:col-span-5 rounded-xl border border-outline-variant bg-surface-container-lowest p-lg">
              <h2 className="font-headline-md text-headline-md text-on-surface">Safety notes</h2>
              <div className="mt-md space-y-md font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                <p>
                  The sandbox is designed to reduce risk, but no execution environment is a substitute for careful review. Treat all code as potentially unsafe and avoid granting unnecessary access to secrets or host resources.
                </p>
                <p>
                  If you plan to deploy this project beyond local use, review your container runtime, resource limits, image hardening, and API exposure carefully.
                </p>
              </div>
              <div className="mt-lg flex flex-wrap gap-sm">
                <Link to="/editor" className="bg-primary text-on-primary px-md py-sm rounded-lg font-label-caps text-label-caps hover:brightness-95 transition-all">
                  Try it now
                </Link>
                <a href="https://github.com/slash-init/sandboxed-code-runner" target="_blank" rel="noopener noreferrer" className="border border-outline text-on-surface px-md py-sm rounded-lg font-label-caps text-label-caps hover:bg-surface-container-low transition-all">
                  View on GitHub
                </a>
              </div>
            </aside>
          </div>
        </section>
      </main>
    </div>
  );
}
