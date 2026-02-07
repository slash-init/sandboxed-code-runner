# Architecture Documentation

## Overview

This online compiler uses Docker containers to execute user-submitted code. The system creates ephemeral containers for each execution request, with resource limits and a timeout mechanism.

---

## Request Flow

```
Client (Browser)
    │
    │ POST /run
    │ { language: "python" | "cpp", code: string, input: string }
    │
    ▼
Express Server (port 3000)
    │
    ├─ Rate limiter (100 req/15min)
    ├─ Validate language support
    ├─ Generate unique job ID: `job-${timestamp}`
    ├─ Create temporary execution directory
    │
    ▼
File System Operations
    │
    ├─ Write code to language-specific file (main.py / main.cpp)
    ├─ Write input to input.txt
    │
    ▼
Docker Execution (via spawn)
    │
    ├─ spawn docker run with security flags
    ├─ Stream stdout chunk-by-chunk
    ├─ Stream stderr chunk-by-chunk
    │
    ▼
Timeout Mechanism
    │
    ├─ Execution completes within 2 seconds
    └─ Timeout triggers `docker kill <container-name>`
    │
    ▼
Cleanup
    │
    ├─ Container auto-removed (--rm flag)
    └─ Temporary directory deleted
    │
    ▼
Response
    │
    └─ { status: "success" | "timeout" | "runtime_error", stdout, stderr }
```

---

## Implemented Features

1. **Ephemeral Containers**:
   - Containers are automatically removed after execution (`--rm`).
   - Named containers (`job-${timestamp}`) for precise timeout handling.

2. **Resource Limits**:
   - CPU: Limited to 1 core (`--cpus=1`).
   - Memory: Limited to 256MB (`--memory=256m`).
   - Processes: Limited to 64 (`--pids-limit=64`).

3. **Security Hardening**:
   - Network isolation: `--network=none` prevents all network access.
   - Capability dropping: `--cap-drop=ALL` removes unnecessary privileges.
   - Read-only filesystem: `--read-only` restricts write access.
   - Non-root execution: Containers run as `sandbox-user` (defined in Dockerfiles).

4. **Timeout Mechanism**:
   - Manual timeout enforcement using `docker kill` after 2 seconds.
   - Spawn-based execution for streaming output and fine-grained control.

5. **Rate Limiting**:
   - 100 requests per 15 minutes per client IP.
   - Standard HTTP 429 responses with clear error messages.

6. **Language Support**:
   - Python 3.11 (slim base image)
   - C++ (GCC 13)
   - Extensible runtime configuration in `runtimes.js`.

---

## Security Model

### Container Isolation

Each execution runs in a fully isolated container with:

- **No network access**: Prevents downloading malicious code or data exfiltration
- **No Linux capabilities**: Removes kernel-level privileges
- **Read-only root filesystem**: Prevents persistent modifications
- **Non-root user**: Limits container escape potential
- **Resource constraints**: CPU, memory, and process limits prevent resource exhaustion

### Attack Mitigation

| Attack Vector          | Mitigation                               |
| ---------------------- | ---------------------------------------- |
| Fork bomb              | `--pids-limit=64`                        |
| Memory bomb            | `--memory=256m`                          |
| CPU exhaustion         | `--cpus=1`                               |
| Infinite loop          | 2-second hard timeout with `docker kill` |
| Network attacks        | `--network=none`                         |
| Privilege escalation   | `--cap-drop=ALL` + non-root user         |
| Filesystem persistence | `--read-only` + temporary directories    |

---

## Implementation Details

### Spawn vs Exec

The system uses Node.js `spawn` instead of `exec` for:

- **Streaming output**: Real-time stdout/stderr collection
- **No shell overhead**: Direct process execution
- **Better timeout control**: Manual kill mechanism via container name
- **Lower memory footprint**: No buffering of complete output

### Execution Lifecycle

1. **Job directory creation**: `executions/${jobId}/`
2. **File writing**: Code and input files
3. **Container spawn**: Docker run with security flags
4. **Stream collection**: Stdout and stderr accumulated
5. **Status determination**:
   - `timeout`: Timer expired, container killed
   - `runtime_error`: stderr has content
   - `success`: Clean execution
6. **Cleanup**: Directory removal, timer cleared

### Runtime Configuration

Runtimes are defined in `src/config/runtimes.js`:

```javascript
{
  image: "sandbox-image-name",
  file: "source-filename"
}
```

This makes adding new languages a matter of:

1. Creating a Dockerfile in `sandbox/{language}/`
2. Building the image
3. Adding an entry to `runtimes.js`

---

## System Architecture

```
┌─────────────────────────────────────────┐
│           Host System                   │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │   Node.js (Express + spawn)       │  │
│  │   - Accepts HTTP requests         │  │
│  │   - Creates temp directories      │  │
│  │   - Spawns Docker containers      │  │
│  │   - Streams execution results     │  │
│  │   - Enforces timeouts             │  │
│  └──────────────┬────────────────────┘  │
│                 │                        │
│  ┌──────────────▼────────────────────┐  │
│  │       Docker Engine               │  │
│  │                                   │  │
│  │  [Container: job-123456]          │  │
│  │   - python:3.11-slim              │  │
│  │   - User: sandbox-user            │  │
│  │   - Network: none                 │  │
│  │   - Read-only FS                  │  │
│  │   - CPU/Memory/PID limits         │  │
│  │                                   │  │
│  │  [Container: job-123457]          │  │
│  │   - gcc:13                        │  │
│  │   - User: sandbox-user            │  │
│  │   - (same restrictions)           │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │      Linux Kernel                 │  │
│  │   - Namespaces (isolation)        │  │
│  │   - Cgroups (resource limits)     │  │
│  │   - Capabilities (all dropped)    │  │
│  │   - Network stack (disabled)      │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

---

## Concurrency Control

The system enforces a **maximum of 5 concurrent executions** via the `MAX_EXECUTIONS` constant in `execution.service.js`. When the limit is reached, new requests receive a `503 Service Unavailable` response.

```javascript
let runningExecutions = 0;
const MAX_EXECUTIONS = 5;
```

This prevents:

- Excessive memory usage on the host
- Docker daemon overload
- Resource starvation for other applications

Execution count is incremented before spawning and decremented during cleanup, with proper resource management to prevent leaks.

---

## Known Limitations

1. **Error Message Exposure**:
   - Full stderr is returned to clients (may leak system information).

2. **Container Image Vulnerabilities**:
   - Base images (python:3.11-slim, gcc:13) may have CVEs.

3. **No Input Validation**:
   - Code content is not validated before execution.

4. **Single-Server Architecture**:
   - No horizontal scaling or load distribution.

5. **Concurrency Ceiling**:
   - Maximum 5 concurrent executions (configurable but not auto-scaling).

6. **Temporary File Races**:
   - Timestamp-based job IDs may collide under high concurrency.

---

## Future Improvements

1. **Error Sanitization**:
   - Filter stderr before returning to client.

2. **Hardened Base Images**:
   - Use distroless or minimal base images.

3. **UUID-based Job IDs**:
   - Replace timestamp with UUID for collision resistance.

4. **Persistent Logging**:
   - Log all executions for audit and debugging.

5. **Additional Languages**:
   - JavaScript (Node.js), Java, Rust, Go support.

6. **Output Size Limits**:
   - Truncate excessive stdout/stderr to prevent response bloat.
