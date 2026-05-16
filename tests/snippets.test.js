import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';

// Mock getPrisma
vi.mock('../src/lib/prisma.js', () => {
  return {
    default: vi.fn(() => ({
      snippet: {
        create: vi.fn(({ data }) => Promise.resolve({ id: 'mock-id', ...data })),
        findUnique: vi.fn(({ where }) => {
          if (where.id === 'valid-id') {
            return Promise.resolve({
              id: 'valid-id',
              language: 'python',
              code: 'print("hello")',
              input: '',
              createdAt: new Date().toISOString(),
            });
          }
          return Promise.resolve(null);
        }),
      },
    })),
  };
});

describe('Snippet Routes', () => {
  describe('POST /snippets', () => {
    it('should create a new snippet', async () => {
      const res = await request(app)
        .post('/snippets')
        .send({
          language: 'python',
          code: 'print("hello")',
          input: '',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('id', 'mock-id');
    });

    it('should return 400 if language or code is missing', async () => {
      const res = await request(app)
        .post('/snippets')
        .send({ language: 'python' });
      
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error', 'Language and code are required');
    });

    it('should return 400 for unsupported language', async () => {
      const res = await request(app)
        .post('/snippets')
        .send({ language: 'rust', code: 'fn main() {}' });
      
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error', 'Unsupported language');
    });
  });

  describe('GET /snippets/:id', () => {
    it('should retrieve a snippet by ID', async () => {
      const res = await request(app).get('/snippets/valid-id');
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('id', 'valid-id');
      expect(res.body.language).toBe('python');
    });

    it('should return 404 for non-existent snippet', async () => {
      const res = await request(app).get('/snippets/invalid-id');
      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('error', 'Snippet not found');
    });
  });
});
