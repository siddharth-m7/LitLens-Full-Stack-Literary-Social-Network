const request = require('supertest');
const app = require('../app');
const { connect, disconnect, clearDatabase } = require('./helpers/db');

const BASE = '/api/v1/auth';

beforeAll(async () => { await connect(); });
afterAll(async () => { await disconnect(); });
afterEach(async () => { await clearDatabase(); });

// ─── Register ─────────────────────────────────────────────────────────────────

describe('POST /auth/register', () => {
  const validUser = { name: 'Alice', email: 'alice@example.com', password: 'password123' };

  it('registers a new user and returns a token', async () => {
    const res = await request(app).post(`${BASE}/register`).send(validUser);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('refreshToken');
    expect(res.body.user).toMatchObject({ name: 'Alice', email: 'alice@example.com', role: 'user' });
  });

  it('returns 400 when email is already taken', async () => {
    await request(app).post(`${BASE}/register`).send(validUser);
    const res = await request(app).post(`${BASE}/register`).send(validUser);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already exists/i);
  });

  it('returns 422 when name is missing', async () => {
    const res = await request(app).post(`${BASE}/register`).send({ email: 'a@b.com', password: '123456' });

    expect(res.status).toBe(422);
    expect(res.body.errors[0].field).toBe('name');
  });

  it('returns 422 when email is invalid', async () => {
    const res = await request(app).post(`${BASE}/register`).send({ name: 'Bob', email: 'not-an-email', password: '123456' });

    expect(res.status).toBe(422);
    expect(res.body.errors[0].field).toBe('email');
  });

  it('returns 422 when password is too short', async () => {
    const res = await request(app).post(`${BASE}/register`).send({ name: 'Bob', email: 'bob@example.com', password: '123' });

    expect(res.status).toBe(422);
    expect(res.body.errors[0].field).toBe('password');
  });
});

// ─── Login ────────────────────────────────────────────────────────────────────

describe('POST /auth/login', () => {
  beforeEach(async () => {
    await request(app).post(`${BASE}/register`).send({ name: 'Alice', email: 'alice@example.com', password: 'password123' });
  });

  it('logs in with correct credentials and returns a token', async () => {
    const res = await request(app).post(`${BASE}/login`).send({ email: 'alice@example.com', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toBe('alice@example.com');
  });

  it('returns 400 for wrong password', async () => {
    const res = await request(app).post(`${BASE}/login`).send({ email: 'alice@example.com', password: 'wrongpassword' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalid credentials/i);
  });

  it('returns 400 for unknown email', async () => {
    const res = await request(app).post(`${BASE}/login`).send({ email: 'ghost@example.com', password: 'password123' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalid credentials/i);
  });

  it('returns 422 when email field is missing', async () => {
    const res = await request(app).post(`${BASE}/login`).send({ password: 'password123' });

    expect(res.status).toBe(422);
  });

  it('returns 403 when user is banned', async () => {
    const User = require('../models/User');
    await User.findOneAndUpdate({ email: 'alice@example.com' }, { banned: true });

    const res = await request(app).post(`${BASE}/login`).send({ email: 'alice@example.com', password: 'password123' });

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/banned/i);
  });
});

// ─── Profile ──────────────────────────────────────────────────────────────────

describe('GET /auth/profile', () => {
  let token;

  beforeEach(async () => {
    const res = await request(app).post(`${BASE}/register`).send({ name: 'Alice', email: 'alice@example.com', password: 'password123' });
    token = res.body.token;
  });

  it('returns profile for authenticated user', async () => {
    const res = await request(app).get(`${BASE}/profile`).set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.email).toBe('alice@example.com');
    expect(res.body.password).toBeUndefined();
  });

  it('returns 401 when no token is provided', async () => {
    const res = await request(app).get(`${BASE}/profile`);

    expect(res.status).toBe(401);
  });

  it('returns 403 when token is invalid', async () => {
    const res = await request(app).get(`${BASE}/profile`).set('Authorization', 'Bearer invalid.token.here');

    expect(res.status).toBe(403);
  });
});
