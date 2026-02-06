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
    ├─ Validate language support
    ├─ Generate container name: `job-${timestamp}`
    │
    ▼
Dockerode Client
    │
    ├─ docker run (with resource limits)
    ├─ Write code and input to temp files
    ├─ Execute language-specific command
    │
    ▼
Timeout Mechanism
    │
    ├─ Execution completes within 2 seconds
    └─ Timeout triggers `docker kill`
    │
    ▼
Finally Block
    │
    └─ container removed, temp files cleaned up
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

2. **Resource Limits**:
   - CPU: Limited to 1 core (`--cpus=1`).
   - Memory: Limited to 256MB (`--memory=256m`).
   - Processes: Limited to 64 (`--pids-limit=64`).

3. **Timeout Mechanism**:
   - Execution is manually terminated after 2 seconds using `docker kill`.

4. **Rate Limiting**:
   - 100 requests per 15 minutes per client.

5. **Language Support**:
   - Python and C++ are supported.

---

## Security Gaps

1. **Network Isolation**:
   - Containers are not run with `--network=none`, leaving them vulnerable to network-based attacks.

2. **Capability Dropping**:
   - Containers are not run with `--cap-drop=ALL`, allowing unnecessary privileges.

3. **Read-only Filesystem**:
   - Containers are not run with a read-only filesystem.

4. **Non-root User**:
   - Containers run as root, increasing the risk of container escape.

5. **Error Handling**:
   - Full `stderr` is returned to the client, which may expose sensitive information.

---

## Required Improvements

1. **Network Isolation**:
   - Add `--network=none` to disable network access.

2. **Capability Dropping**:
   - Add `--cap-drop=ALL` to drop unnecessary privileges.

3. **Read-only Filesystem**:
   - Add `--read-only` to restrict write access.

4. **Non-root User**:
   - Update Dockerfiles to use a non-root user.

5. **Enhanced Error Handling**:
   - Sanitize error messages before returning them to the client.

---

## System Architecture

```
┌─────────────────────────────────────────┐
│           Host System                   │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │   Node.js (Express + Dockerode)   │  │
│  │   - Accepts HTTP requests         │  │
│  │   - Manages Docker containers     │  │
│  │   - Returns execution results     │  │
│  └──────────────┬────────────────────┘  │
│                 │                        │
│  ┌──────────────▼────────────────────┐  │
│  │       Docker Engine               │  │
│  │                                   │  │
│  │  [Container]  [Container]  ...    │  │
│  │   python:3.11   gcc:13            │  │
│  │   (executing)  (executing)        │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │      Linux Kernel                 │  │
│  │   - Namespaces (Docker default)   │  │
│  │   - Cgroups (resource limits)     │  │
│  │   - Capabilities (not dropped)    │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```
