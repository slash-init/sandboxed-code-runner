# Sandboxed Code Runner

A full-stack web application that allows users to write, execute, and share code securely in isolated Docker containers.

This project provides a premium, glassmorphic frontend editor paired with a robust backend execution engine designed to handle untrusted user code safely.

---

## Core Features

- **Rich Code Editor**: Integrated Monaco Editor with syntax highlighting, IntelliSense, auto-formatting, and intelligent tab support.
- **Premium UI**: Multi-theme system (Dark Nebula, Midnight Ocean, Aura Light, Cyber Neon) with a responsive, glassmorphic split-pane layout.
- **Secure Sandboxed Execution**: User code runs inside isolated, constrained Docker containers.
- **Resource Limits**: Enforced CPU, memory, process count, and execution time limits.
- **Snippet Sharing**: Save your code and generate a unique URL to share with others.
- **Real-Time Output**: Streaming execution results with classified statuses (Success, Timeout, Runtime Error).

---

## High-Level Architecture

The system is composed of two main parts:

### Frontend (Client)
- Built with React and Vite.
- Uses `@monaco-editor/react` for the code editing experience.
- Communicates with the backend via a Vite proxy.

### Backend (Server)
- Built with Node.js (Express).
- Uses Prisma ORM with PostgreSQL to store shared code snippets.
- Manages secure code execution using `spawn` to run Docker containers.
- Limits execution with strict constraints (e.g., `--network=none`, `--read-only`, `--cap-drop=ALL`).

---

## Technology Stack

### Frontend
- React 18
- Vite
- Monaco Editor
- Vanilla CSS (CSS Variables for dynamic theming)
- Lucide React (Icons)

### Backend
- Node.js & Express
- Prisma (ORM)
- PostgreSQL (Database)
- Docker (Execution Engine)

---

## Sandbox Guarantees

Each execution is constrained by:

- **CPU limit**: 1 core maximum
- **Memory limit**: 256MB maximum
- **Process limit**: 64 processes maximum
- **Hard execution timeout**: 2 seconds (enforced via `docker kill`)
- **Network isolation**: Complete network stack disabled
- **Filesystem isolation**: Read-only root filesystem
- **Privilege isolation**: All Linux capabilities dropped
- **User isolation**: Runs as non-root `sandbox-user`

This prevents common abuse patterns such as infinite loops, memory bombs, fork bombs, lingering processes, network attacks, and privilege escalation.

---

## Project Structure

```text
sandboxed-code-runner/
├── client/                 # React frontend application
│   ├── src/                # Frontend source code
│   └── vite.config.ts      # Vite configuration (includes API proxy)
├── sandbox/                # Docker image definitions
│   ├── python/             # Python 3.11 sandbox
│   └── cpp/                # GCC 13 sandbox
├── prisma/                 # Database schema and migrations
│   └── schema.prisma       # Snippet models
├── src/                    # Backend source code
│   ├── app.js              # Express app setup
│   ├── server.js           # Server entry point
│   ├── config/             # Rate limiting and runtime config
│   ├── routes/             # API endpoints (/run, /snippets)
│   └── services/           # Docker execution logic
├── executions/             # Ephemeral execution directories
├── package.json            # Backend dependencies
├── README.md               # Project documentation
└── SETUP.md                # Installation and setup guide
```

---

## Getting Started

Please see [SETUP.md](SETUP.md) for detailed instructions on how to install, configure, and run the project locally.

---

## Disclaimer

This project demonstrates isolation techniques, but it is not intended to be deployed as-is in hostile production environments without additional hardening, monitoring, and security controls.
