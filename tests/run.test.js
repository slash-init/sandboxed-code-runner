import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';

describe('POST /run', () => {
  it('should execute Python code successfully', async () => {
    const res = await request(app)
      .post('/run')
      .send({
        language: 'python',
        code: 'print("Hello from Vitest")',
      });
    
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.stdout).toContain('Hello from Vitest');
  }, 10000);

  it('should handle Python runtime errors', async () => {
    const res = await request(app)
      .post('/run')
      .send({
        language: 'python',
        code: '1 / 0',
      });
    
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('runtime_error');
    expect(res.body.stderr).toContain('ZeroDivisionError');
  }, 10000);

  it('should handle Python timeouts', async () => {
    const res = await request(app)
      .post('/run')
      .send({
        language: 'python',
        code: 'import time\ntime.sleep(5)',
      });
    
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('timeout');
  }, 10000);

  it('should execute C++ code successfully', async () => {
    const res = await request(app)
      .post('/run')
      .send({
        language: 'cpp',
        code: '#include <iostream>\nint main() { std::cout << "Hello CPP"; return 0; }',
      });
    
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.stdout).toContain('Hello CPP');
  }, 20000); // C++ might take longer to compile

  it('should return 400 for unsupported language', async () => {
    const res = await request(app)
      .post('/run')
      .send({
        language: 'rust',
        code: 'fn main() {}',
      });
    
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error', 'Unsupported language');
  });
});
