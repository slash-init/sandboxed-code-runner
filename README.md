# Online Code Execution Backend (Sandboxed)

A backend service that executes user-submitted code in isolated, resource-limited Docker containers.

The system is designed as a **sandboxed execution engine** for untrusted code, focusing on correctness, isolation, and lifecycle control rather than UI or editor features.

---

## Why This Project Exists

Executing arbitrary user code is inherently dangerous. Running programs directly on a server can lead to:

- Infinite loops exhausting CPU
- Memory exhaustion
- Fork bombs
- Zombie processes
- Unauthorized filesystem access

This project demonstrates how to mitigate these risks by running each execution inside a constrained, disposable container with strict resource limits and enforced termination.

It is intended as a **systems-focused backend project**, not a toy compiler.

---

## Core Ideas

- User code is never executed on the host machine
- Each request runs inside its own disposable Docker container
- CPU, memory, process count, and execution time are restricted
- Containers are explicitly named and force-killed on timeout
- All execution artifacts are temporary and cleaned up automatically
- Execution results include a classified status

---

## High-Level Architecture

1. Client sends source code and language via HTTP
2. Backend creates a temporary execution directory
3. Source code is written to a file
4. A Docker container is started with:
   - Limited CPU and memory
   - Limited process count
   - Mounted execution directory
5. Program output is streamed back to the backend
6. On completion or timeout:
   - Container is terminated
   - Temporary files are removed
7. Structured result is returned to the client

---

## Technology Stack

- Node.js (Express)
- Docker
- Python (initial execution runtime)

The architecture is language-agnostic and supports adding additional runtimes.

---

## API Response Format

Each execution returns:

```json
{
  "status": "success | runtime_error | timeout",
  "stdout": "",
  "stderr": ""
}
```

Status is derived from observable execution outcomes.

---

## Sandbox Guarantees

Each execution is constrained by:

- CPU limit
- Memory limit
- Process limit
- Hard execution timeout
- Filesystem isolation
- Explicit container termination

This prevents common abuse patterns such as infinite loops, memory bombs, fork bombs, and lingering processes.

---

## Project Structure

```
backend/
  index.js
  executions/
sandbox/
  Dockerfile
```

- sandbox/ defines execution images
- executions/ holds per-request temporary files (auto-deleted)

---

## Current Limitations

- Single-language runtime configured (Python)
- No authentication or rate limiting
- No persistent storage
- Not hardened for hostile production environments

These are deliberate tradeoffs to keep the focus on sandboxed execution.

---

## Intended Use

- Learning systems-level backend concepts
- Demonstrating container-based sandboxing
- Portfolio or academic project
- Foundation for an online judge or execution service

---

## Disclaimer

This project demonstrates isolation techniques, but it is not intended to be deployed as-is in hostile production environments without additional hardening, monitoring, and security controls.

---

## Author

Built as an exploration of execution pipelines, process isolation, and container lifecycle management.
