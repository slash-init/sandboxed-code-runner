# Online Code Execution Backend (Sandboxed)

A backend service that executes user-submitted code in an isolated, resource-limited environment using Docker.

This project focuses on **safe execution of untrusted code**, not on UI or language features.

---

## Why This Project Exists

Executing arbitrary code is inherently dangerous. Running user programs directly on a server can lead to:

- Infinite loops exhausting CPU
- Memory exhaustion
- Fork bombs
- Unauthorized filesystem access

This project demonstrates how to mitigate those risks by isolating execution inside Docker containers with strict limits.

It is intended as a **systems-focused backend project**, not a toy compiler.

---

## Core Ideas

- User code is never executed on the host machine
- Each execution runs in its own disposable container
- CPU, memory, process count, and execution time are restricted
- All execution artifacts are temporary and cleaned up automatically

---

## High-Level Architecture

1. Client sends source code via HTTP
2. Backend creates a temporary execution directory
3. Source code is written to a file
4. A Docker container is started with:
   - Limited CPU and memory
   - No persistent state
   - Mounted execution directory
5. Program output is captured
6. Container and temporary files are destroyed
7. Output is returned to the client

---

## Technology Stack

- Node.js (Express)
- Docker
- Python (initial execution language)

The architecture is language-agnostic and can be extended to support other languages.

---

## Sandbox Guarantees

Each execution is constrained by:

- CPU limit
- Memory limit
- Process limit
- Execution timeout
- Filesystem isolation

This prevents common abuse patterns such as infinite loops, memory bombs, and fork bombs.

---

## Project Structure

```
backend/
index.js
executions/
sandbox/
Dockerfile
```

- `sandbox/` defines the execution environment
- `executions/` holds per-request temporary files (auto-deleted)

---

## Current Limitations

- Single-language support (Python)
- No authentication or rate limiting
- Uses `exec` instead of streaming execution
- Not hardened for hostile production environments

These are deliberate tradeoffs to keep the focus on execution isolation.

---

## Intended Use

- Learning systems-level backend concepts
- Demonstrating sandboxed execution
- Portfolio or academic project
- Foundation for an online compiler or judge

---

## Disclaimer

This project demonstrates **best practices for isolation**, but it is not intended to be deployed as-is in a hostile production environment without further hardening.

---

## Author

Built as an exploration of backend execution pipelines and container-based sandboxing.
