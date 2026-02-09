# Architecture Documentation

## Overview

This sandboxed code runner uses Docker containers to execute user-submitted code safely. The system creates ephemeral containers for each execution request, with resource limits, timeouts, and comprehensive security isolation.

---

## Design Principles

1. **Batch Execution**: Strict concurrency control limits (5 max concurrent executions) to prevent resource exhaustion.

2. **Stateless API**: Each request is independent with no shared state across executions. All state is ephemeral and cleaned up immediately.

3. **Hostile-Code Assumption**: All user code is assumed malicious. Every execution runs in a restrictive sandbox with no network, limited resources, and minimal privileges.

4. **Fail-Fast Cleanup**: Execution failures trigger immediate cleanup. Temporary files and container resources are released before responding to the client.

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
    ├─ Check execution capacity (max 5 concurrent)
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
   - Read-only filesystem: `--read-only` restricts file write access (except mounted volumes).

4. **Timeout Mechanism**:
   - Manual timeout enforcement using `docker kill` after 2 seconds.
   - Spawn-based execution for streaming output and fine-grained control.

5. **Rate Limiting**:
   - 100 requests per 15 minutes per client IP.
   - Standard HTTP 429 responses with clear error messages.

6. **Language Support**:
   - Python 3.11 (slim base image)
   - C++ (GCC compiler)
   - Extensible runtime configuration in `runtimes.js`.

---

## Security Model

### Container Isolation

Each execution runs in a fully isolated container with:

- **No network access**: `--network=none` prevents downloading malicious code or data exfiltration
- **No Linux capabilities**: `--cap-drop=ALL` removes kernel-level privileges
- **Resource constraints**: CPU, memory, and process limits prevent resource exhaustion
- **Temporary writable space**: Job directory mounted as volume (cleaned immediately after execution)

### Attack Mitigation

| Attack Vector        | Mitigation                               |
| -------------------- | ---------------------------------------- |
| Fork bomb            | `--pids-limit=64`                        |
| Memory bomb          | `--memory=256m`                          |
| CPU exhaustion       | `--cpus=1`                               |
| Infinite loop        | 2-second hard timeout with `docker kill` |
| Network attacks      | `--network=none`                         |
| Privilege escalation | `--cap-drop=ALL`                         |

### Planned Security Enhancements

- Non-root user enforcement via distroless base images
- Error message sanitization (filter sensitive stderr)
- Advanced seccomp profiles for syscall filtering

---

## Implementation Details

### Docker Flags and Their Purpose

```
--name <id>          : Name the container for precise timeout control
--rm                 : Auto-remove container after execution completes
--cpus=1             : Limit CPU to 1 core
--memory=256m        : Limit memory to 256 MB
--pids-limit=64      : Limit processes to prevent fork bombs
--network=none       : Disable all network access
--cap-drop=ALL       : Drop all Linux capabilities
-v <host>:<guest>   : Mount code directory into container
```

### Spawn vs Exec

The system uses Node.js `spawn` instead of `exec`:

- **Streaming output**: Real-time stdout/stderr collection without buffering
- **No shell overhead**: Direct process execution
- **Better timeout control**: Manual kill mechanism via container name
- **Lower memory footprint**: Chunk-based streaming instead of buffering complete output

### Execution Lifecycle

1. **Capacity check**: Verify running executions < 5 (fail-fast if at capacity)
2. **Job directory creation**: `executions/${jobId}/` with unique timestamp ID
3. **File writing**: Code and input files written to job directory
4. **Container spawn**: Docker run with security flags and volume mount
5. **Stream collection**: Stdout and stderr accumulated chunk-by-chunk
6. **Status determination**:
   - `timeout`: Timer expired, container killed
   - `runtime_error`: Stderr has content
   - `success`: Clean execution
7. **Cleanup**: Directory recursively removed, timer cleared, counter decremented

### Runtime Configuration

Runtimes are defined in `src/config/runtimes.js`:

```javascript
{
  image: "python-sandbox" | "cpp-sandbox",
  file: "main.py" | "main.cpp"
}
```

Adding new languages requires:

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
│  │   - Rate limiting & concurrency   │  │
│                 │                        │
│  ┌──────────────▼────────────────────┐  │
│  │       Docker Engine               │  │
│  │                                   │  │
│  │  [Container: job-123456]          │  │
│  │   - python:3.11-slim              │  │
│  │   - Network: none                 │  │
│  │   - CPU/Memory/PID limits         │  │
│  │                                   │  │
│  │  [Container: job-123457]          │  │
│  │   - gcc:13                        │  │
│  │   - Same isolation/limits         │  │
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

1. **Timestamp-Based Job IDs**:
   - Using `Date.now()` may result in collisions under extreme concurrency (though probability is low).

2. **Error Message Exposure**:
   - Full stderr is returned to clients and may leak system information.

3. **Base Image Maintenance**:
   - Container images (python:3.11-slim, gcc:13) require periodic updates for security patches.

---

## Planned Enhancements

1. **UUID-Based Job IDs**:
   - Replace timestamp with UUID v4 for collision-free identification.

2. **Error Sanitization**:
   - Filter stderr before returning to client to prevent information leakage.

3. **Output Size Limits**:
   - Truncate excessive stdout/stderr to prevent response bloat and memory issues.

4. **Persistent Logging**:
   - Log all executions for audit, debugging, and usage analytics.

5. **Hardened Base Images**:
   - Use distroless or security-focused minimal base images with smaller attack surface.

6. **Additional Languages**:
   - JavaScript (Node.js), Java, Rust, Go, TypeScript support.
