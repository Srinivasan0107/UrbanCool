import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../src/index.js';
import User from '../src/models/User.js';

beforeAll(async () => {
  await User.deleteMany({});
});

describe('POST /api/v1/auth/register', () => {
  it('should register a new user and return a token (201)', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      name:     'Test User',
      email:    'test@example.com',
      password: 'password123',
      role:     'citizen',
    });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.error).toBeNull();
  });

  it('should return 409 for duplicate email', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      name:     'Test User',
      email:    'test@example.com',
      password: 'password123',
    });
    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Email already registered');
  });

  it('should return 422 for missing required fields', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      email: 'bad@example.com',
    });
    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
  });

  it('should return 422 for short password', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      name:     'Short',
      email:    'short@example.com',
      password: '123',
    });
    expect(res.status).toBe(422);
  });
});

describe('POST /api/v1/auth/login', () => {
  it('should login with correct credentials (200 + token)', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email:    'test@example.com',
      password: 'password123',
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
  });

  it('should return 401 for wrong password', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email:    'test@example.com',
      password: 'wrongpass',
    });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should return 401 for non-existent email', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email:    'nobody@example.com',
      password: 'password123',
    });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

describe('POST /api/v1/auth/google', () => {
  it('should return 400 if credential is missing', async () => {
    const res = await request(app).post('/api/v1/auth/google').send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should authenticate a valid Google token payload and return UrbanCool token', async () => {
    const mockGoogleToken = jwt.sign(
      { sub: 'google-sub-12345', email: 'googleuser@urbancool.dev', name: 'Google User' },
      'dummy-secret'
    );
    const res = await request(app).post('/api/v1/auth/google').send({
      credential: mockGoogleToken,
      role: 'planner',
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.role).toBe('planner');
    expect(res.body.data.email).toBe('googleuser@urbancool.dev');
  });
});
