require('dotenv').config();
const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');

// Minimal app setup for testing auth routes
const app = express();
app.use(express.json());

const authRoutes = require('../routes/auth');
app.use('/api/auth', authRoutes);

// Error handler
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({ mensaje: err.message || 'Error' });
});

describe('Auth Routes', () => {
  describe('POST /api/auth/login', () => {
    it('should return 400 if email is invalid', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'not-an-email', password: '123456' });
      expect(res.status).toBe(400);
      expect(res.body.mensaje).toBeDefined();
    });

    it('should return 400 if password is missing', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@test.com' });
      expect(res.status).toBe(400);
      expect(res.body.mensaje).toBeDefined();
    });

    it('should return 401 for non-existent user', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'noexiste@test.com', password: '123456' });
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/auth/perfil', () => {
    it('should return 401 without token', async () => {
      const res = await request(app).get('/api/auth/perfil');
      expect(res.status).toBe(401);
    });

    it('should return 401 with invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/perfil')
        .set('Authorization', 'Bearer invalidtoken123');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/auth/registrar', () => {
    it('should return 401 without token (admin only)', async () => {
      const res = await request(app)
        .post('/api/auth/registrar')
        .send({ nombre: 'Test', apellido: 'User', email: 'test@test.com' });
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/auth/usuarios', () => {
    it('should return 401 without token', async () => {
      const res = await request(app).get('/api/auth/usuarios');
      expect(res.status).toBe(401);
    });
  });
});

describe('Utilities', () => {
  const { generarPasswordAleatorio } = require('../utils/helpers');
  const { paginate, paginatedResponse } = require('../utils/pagination');

  describe('generarPasswordAleatorio', () => {
    it('should generate password of default length 10', () => {
      const pw = generarPasswordAleatorio();
      expect(pw.length).toBe(10);
    });

    it('should generate password of custom length', () => {
      const pw = generarPasswordAleatorio(16);
      expect(pw.length).toBe(16);
    });

    it('should generate different passwords each time', () => {
      const pw1 = generarPasswordAleatorio();
      const pw2 = generarPasswordAleatorio();
      expect(pw1).not.toBe(pw2);
    });
  });

  describe('paginate', () => {
    it('should return defaults for empty query', () => {
      const result = paginate({});
      expect(result).toEqual({ page: 1, limit: 20, offset: 0 });
    });

    it('should calculate offset correctly', () => {
      const result = paginate({ page: '3', limit: '10' });
      expect(result).toEqual({ page: 3, limit: 10, offset: 20 });
    });

    it('should cap limit at 100', () => {
      const result = paginate({ page: '1', limit: '500' });
      expect(result.limit).toBe(100);
    });

    it('should enforce minimum page 1', () => {
      const result = paginate({ page: '-5' });
      expect(result.page).toBe(1);
    });
  });

  describe('paginatedResponse', () => {
    it('should format response correctly', () => {
      const result = paginatedResponse(['a', 'b'], 50, { page: 2, limit: 10 });
      expect(result.data).toEqual(['a', 'b']);
      expect(result.pagination).toEqual({ total: 50, page: 2, limit: 10, totalPages: 5 });
    });
  });

  describe('validate middleware', () => {
    const validate = require('../middleware/validate');
    const { body } = require('express-validator');

    it('should call next() when no validation errors', async () => {
      const testApp = express();
      testApp.use(express.json());
      testApp.post('/test', [body('name').notEmpty()], validate, (req, res) => res.json({ ok: true }));

      const res = await request(testApp).post('/test').send({ name: 'John' });
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
    });

    it('should return 400 when validation fails', async () => {
      const testApp = express();
      testApp.use(express.json());
      testApp.post('/test', [body('name').notEmpty().withMessage('Nombre requerido')], validate, (req, res) => res.json({ ok: true }));

      const res = await request(testApp).post('/test').send({});
      expect(res.status).toBe(400);
      expect(res.body.mensaje).toBe('Nombre requerido');
      expect(res.body.errores).toBeDefined();
    });
  });
});
