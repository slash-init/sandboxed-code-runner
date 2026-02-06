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
- Network-based attacks
- Container escape attempts

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
- Network access is completely disabled
- Containers run with dropped capabilities and read-only filesystems
- Non-root user execution for additional security

---

## High-Level Architecture

1. Client sends source code and language via HTTP POST to `/run`
2. Backend validates the language and generates a unique job ID
3. A temporary execution directory is created
4. Source code and input are written to files
5. A Docker container is spawned with:
   - Limited CPU (1 core) and memory (256MB)
   - Limited process count (64)
   - No network access (`--network=none`)
   - All capabilities dropped (`--cap-drop=ALL`)
   - Read-only filesystem (`--read-only`)
   - Non-root user execution
   - Mounted execution directory (read/write overlay)
6. Program output is streamed back to the backend via spawn
7. Manual timeout enforced at 2 seconds using `docker kill`
8. On completion or timeout:
   - Container is automatically removed (`--rm`)
   - Temporary files are deleted
9. Structured result with status classification is returned to the client

---

## Technology Stack

- **Runtime**: Node.js (Express)
- **Containerization**: Docker
- **Process Management**: Node.js `spawn` (streaming, no shell overhead)
- **Rate Limiting**: express-rate-limit
- **Sandbox Images**:
  - Python 3.11 (slim variant)
  - GCC 13
- **Security**: Multi-layered container isolation with resource constraints

The architecture is language-agnostic and supports adding additional runtimes.

---

## API Specification

### Endpoint

`POST /run`

### Request Body

```json
{
  "language": "python" | "cpp",
  "code": "source code as string",
  "input": "stdin input as string (optional)"
}
```

### Response Format

Each execution returns:

```json
{
  "status": "success | runtime_error | timeout",
  "stdout": "program output",
  "stderr": "error output"
}
```

**Status Classification**:

- `timeout`: Execution exceeded 2-second limit
- `runtime_error`: Program produced stderr output
- `success`: Clean execution with no errors

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
- **Explicit container termination**: Named containers killed on timeout
- **Automatic cleanup**: Container removal and temp file deletion

This prevents common abuse patterns such as infinite loops, memory bombs, fork bombs, lingering processes, network attacks, and privilege escalation.

---

## Security Features

### Multi-Layer Defense

1. **Container Isolation**: Each execution in separate namespace
2. **Resource Limits**: Cgroups prevent resource exhaustion
3. **Network Denial**: `--network=none` blocks all networking
4. **Capability Dropping**: `--cap-drop=ALL` removes kernel privileges
5. **Read-Only FS**: `--read-only` prevents persistence attacks
6. **Non-Root User**: Reduces container escape risk
7. **Rate Limiting**: 100 requests per 15 minutes per IP
8. **Forced Termination**: Manual timeout with container kill

### What's Protected Against

- ✅ Infinite loops
- ✅ Memory bombs
- ✅ Fork bombs
- ✅ CPU exhaustion
- ✅ Network attacks
- ✅ Privilege escalation attempts
- ✅ Persistent filesystem modifications
- ✅ API abuse via rate limiting

---

## Project Structure

```
executions/              # Temporary per-request directories (auto-deleted)
sandbox/
  cpp/
    Dockerfile          # GCC 13 with non-root user
  python/
    Dockerfile          # Python 3.11-slim with non-root user
src/
  app.js               # Express app setup
  server.js            # Server entry point (port 3000)
  config/
    limits.js          # Rate limiting configuration
    runtimes.js        # Language runtime definitions
  routes/
    run.routes.js      # POST /run endpoint
  services/
    execution.service.js  # Core execution logic with spawn
package.json
```

### Key Files

- **sandbox/**: Language-specific Dockerfiles with security configurations
- **executions/**: Ephemeral directories for per-request files (created/deleted automatically)
- **src/config/runtimes.js**: Maps languages to Docker images and source filenames
- **src/services/execution.service.js**: Spawn-based execution with streaming output and timeout handling

---

## How to Run

### Prerequisites

- Node.js 18+
- Docker installed and running
- Build sandbox images:

```bash
cd sandbox/python && docker build -t python-sandbox .
cd ../cpp && docker build -t cpp-sandbox .
```

### Start Server

```bash
npm install
npm run dev
```

Server runs on port 3000.

### Example Request

```bash
curl -X POST http://localhost:3000/run \
  -H "Content-Type: application/json" \
  -d '{
    "language": "python",
    "code": "print(\"Hello, World!\")",
    "input": ""
  }'
```

---

## Current Limitations

- Limited runtime set (Python, C++)
- No authentication or user accounts
- No persistent storage or execution history
- Full stderr returned (potential information leak)
- Timestamp-based job IDs (collision risk under high load)
- Single-server architecture (no horizontal scaling)

These are deliberate tradeoffs to keep the focus on sandboxed execution fundamentals.

---

## Intended Use

- Learning systems-level backend concepts
- Demonstrating container-based sandboxing
- Understanding process isolation and resource limits
- Portfolio or academic project
- Foundation for an online judge or execution service
- Study material for secure code execution

---

## Why Spawn Over Exec?

The implementation uses Node.js `spawn` instead of `exec` for:

1. **Streaming**: Real-time stdout/stderr collection without buffering
2. **No shell overhead**: Direct process execution
3. **Better control**: Manual timeout implementation via container name
4. **Memory efficiency**: No need to buffer entire output

---

## Disclaimer

This project demonstrates isolation techniques, but it is not intended to be deployed as-is in hostile production environments without additional hardening, monitoring, and security controls.

Specific concerns for production deployment:

- Container image vulnerability scanning
- Error message sanitization
- Authentication and authorization
- Logging and audit trails
- Horizontal scaling and load balancing
- Database for execution history
- Enhanced input validation

---

## Author

Built as an exploration of execution pipelines, process isolation, and container lifecycle management.
