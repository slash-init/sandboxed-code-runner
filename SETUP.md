# Setup Guide

This guide walks you through setting up the Online Code Execution Backend on your local machine.

---

## Prerequisites

Before you begin, ensure you have the following installed:

### System Requirements

- **Node.js**: v18 or higher
- **npm**: Comes with Node.js
- **Docker**: Latest stable version
  - Must be installed and running on your system
  - Your user should have permission to run Docker commands (typically requires being in the `docker` group or using `sudo`)
- **Git**: For cloning the repository (optional if downloading as ZIP)

### Verify Prerequisites

Run these commands to confirm your setup:

```bash
node --version    # Should be v18+
npm --version     # Should be v9+
docker --version  # Should be Docker 20.10+
```

---

## Installation Steps

### 1. Clone or Download the Repository

```bash
# Using Git
git clone <repository-url>
cd sandboxed-code-runner

# Or download as ZIP and extract
```

### 2. Install Node Dependencies

```bash
npm install
```

This installs:

- **express**: Web framework for the API
- **express-rate-limit**: Rate limiting middleware
- **nodemon**: Development tool for auto-restart on file changes

### 3. Build Sandbox Docker Images

The system requires two Docker images: one for Python and one for C++.

#### Build Python Sandbox

```bash
cd sandbox/python
docker build -t python-sandbox .
cd ../..
```

#### Build C++ Sandbox

```bash
cd sandbox/cpp
docker build -t cpp-sandbox .
cd ../..
```

#### Verify Images

```bash
docker images | grep sandbox
```

You should see:

```
python-sandbox       latest    <IMAGE_ID>
cpp-sandbox          latest    <IMAGE_ID>
```

---

## Running the Server

### Development Mode

```bash
npm run dev
```

The server will start on `http://localhost:3000`.

**Output:**

```
Server running on port 3000
```

Nodemon will automatically restart the server when you edit files.

### Production Mode

```bash
npm start
```

Note: You'll need to add a `start` script to `package.json` if not already present.

---

## Verifying the Setup

### Test with a Simple Request

Open a terminal and execute this curl command:

#### Python Example

```bash
curl -X POST http://localhost:3000/run \
  -H "Content-Type: application/json" \
  -d '{
    "language": "python",
    "code": "print(\"Hello, World!\")",
    "input": ""
  }'
```

**Expected Response:**

```json
{
  "status": "success",
  "stdout": "Hello, World!\n",
  "stderr": ""
}
```

#### C++ Example

```bash
curl -X POST http://localhost:3000/run \
  -H "Content-Type: application/json" \
  -d '{
    "language": "cpp",
    "code": "#include <iostream>\nint main() { std::cout << \"Hello, C++!\" << std::endl; return 0; }",
    "input": ""
  }'
```

**Expected Response:**

```json
{
  "status": "success",
  "stdout": "Hello, C++!\n",
  "stderr": ""
}
```

### Test Error Handling

#### Timeout Test

```bash
curl -X POST http://localhost:3000/run \
  -H "Content-Type: application/json" \
  -d '{
    "language": "python",
    "code": "while True: pass",
    "input": ""
  }'
```

**Expected Response (after ~2 seconds):**

```json
{
  "status": "timeout",
  "stdout": "",
  "stderr": ""
}
```

#### Runtime Error Test

```bash
curl -X POST http://localhost:3000/run \
  -H "Content-Type: application/json" \
  -d '{
    "language": "python",
    "code": "print(undefined_variable)",
    "input": ""
  }'
```

**Expected Response:**

```json
{
  "status": "runtime_error",
  "stdout": "",
  "stderr": "Traceback (most recent call last):\n  File \"/app/main.py\", line 1, in <module>\n    print(undefined_variable)\nNameError: name 'undefined_variable' is not defined\n"
}
```

---

## Configuration

### Rate Limiting

Edit [src/config/limits.js](src/config/limits.js) to adjust rate limits:

```javascript
export const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // Time window (15 minutes)
  limit: 100, // Max requests per window
  // ... other options
});
```

### Execution Limits

Edit [src/services/execution.service.js](src/services/execution.service.js) to adjust resource constraints:

```javascript
const MAX_EXECUTIONS = 5; // Max concurrent executions
const TIME_LIMIT = 2000; // Timeout in milliseconds (2 seconds)
```

Docker container limits are configured in the `spawn` call:

- `--cpus=1`: 1 CPU core maximum
- `--memory=256m`: 256MB RAM maximum
- `--pids-limit=64`: 64 processes maximum

### Adding New Languages

To add support for a new language (e.g., JavaScript/Node.js):

1. **Create Dockerfile** in `sandbox/{language}/Dockerfile`:

   ```dockerfile
   FROM node:18-slim
   WORKDIR /app
   RUN useradd -m sandbox-user
   USER sandbox-user
   CMD ["bash", "-c", "node main.js < input.txt"]
   ```

2. **Build the image**:

   ```bash
   cd sandbox/javascript
   docker build -t javascript-sandbox .
   ```

3. **Register in runtimes** ([src/config/runtimes.js](src/config/runtimes.js)):

   ```javascript
   export const runtimes = {
     // ... existing runtimes
     javascript: {
       image: "javascript-sandbox",
       file: "main.js",
     },
   };
   ```

4. **Test**:
   ```bash
   curl -X POST http://localhost:3000/run \
     -H "Content-Type: application/json" \
     -d '{"language": "javascript", "code": "console.log(\"Hello JS\")", "input": ""}'
   ```

---

## Troubleshooting

### Docker Daemon Not Running

**Error:**

```
Error: Failed to start execution container
```

**Solution:**

```bash
# Start Docker daemon
sudo systemctl start docker

# Or on macOS
open -a Docker
```

### Permission Denied Errors

**Error:**

```
permission denied while trying to connect to the Docker daemon
```

**Solution:**

```bash
# Add current user to docker group
sudo usermod -aG docker $USER

# Activate group membership (or restart terminal)
newgrp docker
```

### Port 3000 Already in Use

**Error:**

```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution:**

```bash
# Find process using port 3000
lsof -i :3000

# Kill the process (replace PID with actual process ID)
kill -9 <PID>

# Or use a different port by modifying src/server.js
app.listen(3001, () => { ... })
```

### Sandbox Images Not Found

**Error:**

```
docker: Error response from daemon: pull access denied for python-sandbox
```

**Solution:**
Rebuild the images:

```bash
cd sandbox/python && docker build -t python-sandbox .
cd ../cpp && docker build -t cpp-sandbox .
```

### Node Modules Not Installed

**Error:**

```
Cannot find module 'express'
```

**Solution:**

```bash
npm install
```

---

## Project Structure

```
online-compiler/
├── sandbox/                 # Docker image definitions
│   ├── python/             # Python 3.11 sandbox
│   │   └── Dockerfile
│   └── cpp/                # GCC 13 sandbox
│       └── Dockerfile
├── src/
│   ├── app.js              # Express app setup
│   ├── server.js           # Server entry point
│   ├── config/
│   │   ├── limits.js       # Rate limiting configuration
│   │   └── runtimes.js     # Language runtime mappings
│   ├── routes/
│   │   └── run.routes.js   # Execution endpoint
│   └── services/
│       └── execution.service.js  # Core execution logic
├── executions/             # Temporary execution directories (auto-created/cleaned)
├── package.json
├── README.md
├── ARCHITECTURE.md
└── SETUP.md
```

---

## API Usage

### Endpoint

```
POST /run
```

### Request Format

```json
{
  "language": "python" | "cpp",
  "code": "source code as string",
  "input": "stdin input as string (optional)"
}
```

### Response Format

```json
{
  "status": "success" | "runtime_error" | "timeout",
  "stdout": "program output",
  "stderr": "error output or empty string"
}
```

---

## Next Steps

- Read [README.md](README.md) for project overview
- Read [ARCHITECTURE.md](ARCHITECTURE.md) for technical details
- Modify rate limits or execution timeouts as needed
- Add new language support following the "Adding New Languages" section above
- Deploy to a production environment with appropriate reverse proxy and security hardening

---

## Getting Help

If you encounter issues:

1. Check Docker is running: `docker ps`
2. Verify images exist: `docker images | grep sandbox`
3. Check server logs for errors
4. Test with the curl examples in "Verifying the Setup" section
5. Review the troubleshooting section above
