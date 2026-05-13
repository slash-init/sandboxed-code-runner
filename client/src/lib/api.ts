const API_BASE = import.meta.env.VITE_API_URL || '/api';

export interface RunRequest {
  language: 'python' | 'cpp' | 'javascript';
  code: string;
  input: string;
}

export interface RunResponse {
  status: 'success' | 'timeout' | 'runtime_error';
  stdout: string;
  stderr: string;
}

export interface HealthResponse {
  status: 'ok';
  timestamp: number;
}

export interface ApiError {
  message: string;
  code?: number;
}

export async function runCode(request: RunRequest): Promise<RunResponse> {
  const res = await fetch(`${API_BASE}/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw {
      message: body.error || body.message || `Execution failed (HTTP ${res.status})`,
      code: res.status,
    } as ApiError;
  }

  return res.json();
}

export async function healthCheck(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return false;
    const data: HealthResponse = await res.json();
    return data.status === 'ok';
  } catch {
    return false;
  }
}

export interface SnippetResponse {
  id: string;
  language: string;
  code: string;
  input: string;
  createdAt: string;
}

export async function saveSnippet(data: { language: string; code: string; input: string }): Promise<{ id: string }> {
  const res = await fetch(`${API_BASE}/snippets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw {
      message: body.error || `Failed to save snippet (HTTP ${res.status})`,
      code: res.status,
    } as ApiError;
  }

  return res.json();
}

export async function getSnippet(id: string): Promise<SnippetResponse> {
  const res = await fetch(`${API_BASE}/snippets/${id}`, {
    signal: AbortSignal.timeout(5000),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw {
      message: body.error || `Snippet not found (HTTP ${res.status})`,
      code: res.status,
    } as ApiError;
  }

  return res.json();
}
