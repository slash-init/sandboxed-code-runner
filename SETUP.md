# Setup Guide

This guide walks you through setting up the Sandbx. application (both frontend and backend) on your local machine.

---

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: v18 or higher
- **npm**: Comes with Node.js
- **Docker**: Latest stable version (must be running)
- **PostgreSQL**: A running PostgreSQL database instance (local or remote)

---

## Installation Steps

### 1. Clone the Repository

```bash
git clone <repository-url>
cd sandboxed-code-runner
```

### 2. Build Sandbox Docker Images

The backend requires Docker images to execute code. Build them first:

```bash
# Build Python Sandbox
cd sandbox/python
docker build -t python-sandbox .
cd ../..

# Build C++ Sandbox
cd sandbox/cpp
docker build -t cpp-sandbox .
cd ../..
```

### 3. Backend Setup

The backend uses Express and Prisma (with PostgreSQL).

1. Install dependencies:
   ```bash
   npm install
   ```

2. Environment Variables:
   Create a `.env` file in the root directory and add your PostgreSQL connection string. You can use `.env.example` as a reference:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/coderunner?schema=public"
   PORT=3000
   ```
   *(Ensure you replace `user`, `password`, and `localhost` with your actual Postgres details)*

3. Initialize the Database:
   Push the Prisma schema to your database to create the required tables for snippet sharing:
   ```bash
   npx prisma db push
   ```

4. Start the Backend Server:
   ```bash
   npm run dev
   ```
   The backend will run on `http://localhost:3000`.

### 4. Frontend Setup

The frontend is a React application powered by Vite.

1. Open a new terminal tab.
2. Navigate to the client directory and install dependencies:
   ```bash
   cd client
   npm install
   ```
3. Start the Frontend Development Server:
   ```bash
   npm run dev
   ```
   The frontend will be available at `http://localhost:5173`. 
   
   *Note: Vite is configured to proxy `/api` requests to `http://localhost:3000` automatically.*

---

## Verifying the Setup

1. Open your browser and navigate to `http://localhost:5173`.
2. Ensure the status bar displays a green **"Connected"** indicator (this means the frontend can successfully communicate with the backend's `/health` endpoint).
3. Select a language (e.g., Python), write some code, and hit **Run**. The output should appear in the right panel.
4. Click the **Share** button. A link should be generated and copied to your clipboard, verifying that the database connection is working.

---

## Adding New Languages

To add support for a new language (e.g., JavaScript/Node.js):

1. **Create Dockerfile** in `sandbox/{language}/Dockerfile`.
2. **Build the image**: `docker build -t {language}-sandbox .`
3. **Register in runtimes** (`src/config/runtimes.js`).
4. Update the frontend's Monaco Editor configuration in `client/src/components/CodeEditor.tsx` and `client/src/components/Editor.tsx` to include the new language.

---

## Troubleshooting

### Docker Permission Denied
If the backend fails to spawn containers due to permission issues:
```bash
sudo usermod -aG docker $USER
newgrp docker
```

### Database Connection Failed
If `npx prisma db push` fails, ensure your PostgreSQL server is running and the `DATABASE_URL` in your `.env` file is correct.

### Frontend Cannot Connect to Backend
Ensure both `npm run dev` (in the root directory) and `npm run dev` (in the `client/` directory) are running simultaneously. 
Check `client/vite.config.ts` to verify the proxy settings point to port `3000`.
