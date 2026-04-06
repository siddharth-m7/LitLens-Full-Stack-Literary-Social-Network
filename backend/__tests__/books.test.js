const request = require('supertest');
const app = require('../app');
const User = require('../models/User');
const { connect, disconnect, clearDatabase } = require('./helpers/db');

const AUTH = '/api/v1/auth';
const BASE = '/api/v1/books';

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function registerAndLogin({ name, email, password, role = 'user' }) {
  const res = await request(app).post(`${AUTH}/register`).send({ name, email, password });
  if (role === 'admin') {
    await User.findByIdAndUpdate(res.body.user.id, { role: 'admin' });
    const loginRes = await request(app).post(`${AUTH}/login`).send({ email, password });
    return loginRes.body.token;
  }
  return res.body.token;
}

const validBook = { title: 'Dune', author: 'Frank Herbert', genre: 'Science Fiction' };

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeAll(async () => { await connect(); });
afterAll(async () => { await disconnect(); });
afterEach(async () => { await clearDatabase(); });

// ─── GET /books ───────────────────────────────────────────────────────────────

describe('GET /books', () => {
  it('returns 200 with empty books array when no books exist', async () => {
    const res = await request(app).get(BASE);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('returns created books in the list', async () => {
    const adminToken = await registerAndLogin({ name: 'Admin', email: 'admin@example.com', password: 'pass123', role: 'admin' });
    await request(app).post(BASE).set('Authorization', `Bearer ${adminToken}`).send(validBook);

    const res = await request(app).get(BASE);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].title).toBe('Dune');
  });

  it('filters books by genre', async () => {
    const adminToken = await registerAndLogin({ name: 'Admin', email: 'admin@example.com', password: 'pass123', role: 'admin' });
    await request(app).post(BASE).set('Authorization', `Bearer ${adminToken}`).send(validBook);
    await request(app).post(BASE).set('Authorization', `Bearer ${adminToken}`).send({ title: 'Pride and Prejudice', author: 'Jane Austen', genre: 'Romance' });

    const res = await request(app).get(`${BASE}?genre=Romance`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].title).toBe('Pride and Prejudice');
  });

  it('searches books by title', async () => {
    const adminToken = await registerAndLogin({ name: 'Admin', email: 'admin@example.com', password: 'pass123', role: 'admin' });
    await request(app).post(BASE).set('Authorization', `Bearer ${adminToken}`).send(validBook);
    await request(app).post(BASE).set('Authorization', `Bearer ${adminToken}`).send({ title: '1984', author: 'George Orwell', genre: 'Fiction' });

    const res = await request(app).get(`${BASE}?search=dune`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].title).toBe('Dune');
  });
});

// ─── GET /books/:id ───────────────────────────────────────────────────────────

describe('GET /books/:id', () => {
  it('returns a book by id', async () => {
    const adminToken = await registerAndLogin({ name: 'Admin', email: 'admin@example.com', password: 'pass123', role: 'admin' });
    const created = await request(app).post(BASE).set('Authorization', `Bearer ${adminToken}`).send(validBook);

    const res = await request(app).get(`${BASE}/${created.body._id}`);

    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Dune');
  });

  it('returns 404 for a non-existent book id', async () => {
    const res = await request(app).get(`${BASE}/000000000000000000000000`);

    expect(res.status).toBe(404);
  });
});

// ─── POST /books ──────────────────────────────────────────────────────────────

describe('POST /books', () => {
  it('admin can create a book and returns 201', async () => {
    const adminToken = await registerAndLogin({ name: 'Admin', email: 'admin@example.com', password: 'pass123', role: 'admin' });

    const res = await request(app).post(BASE).set('Authorization', `Bearer ${adminToken}`).send(validBook);

    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Dune');
    expect(res.body.author).toBe('Frank Herbert');
  });

  it('regular user cannot create a book — returns 403', async () => {
    const userToken = await registerAndLogin({ name: 'Bob', email: 'bob@example.com', password: 'pass123' });

    const res = await request(app).post(BASE).set('Authorization', `Bearer ${userToken}`).send(validBook);

    expect(res.status).toBe(403);
  });

  it('unauthenticated request returns 401', async () => {
    const res = await request(app).post(BASE).send(validBook);

    expect(res.status).toBe(401);
  });

  it('returns 422 when title is missing', async () => {
    const adminToken = await registerAndLogin({ name: 'Admin', email: 'admin@example.com', password: 'pass123', role: 'admin' });

    const res = await request(app).post(BASE).set('Authorization', `Bearer ${adminToken}`).send({ author: 'Frank Herbert' });

    expect(res.status).toBe(422);
    expect(res.body.errors[0].field).toBe('title');
  });
});

// ─── PUT /books/:id ───────────────────────────────────────────────────────────

describe('PUT /books/:id', () => {
  it('admin can update a book', async () => {
    const adminToken = await registerAndLogin({ name: 'Admin', email: 'admin@example.com', password: 'pass123', role: 'admin' });
    const created = await request(app).post(BASE).set('Authorization', `Bearer ${adminToken}`).send(validBook);

    const res = await request(app)
      .put(`${BASE}/${created.body._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Dune Messiah', author: 'Frank Herbert', genre: 'Science Fiction' });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Dune Messiah');
  });

  it('regular user cannot update a book — returns 403', async () => {
    const adminToken = await registerAndLogin({ name: 'Admin', email: 'admin@example.com', password: 'pass123', role: 'admin' });
    const created = await request(app).post(BASE).set('Authorization', `Bearer ${adminToken}`).send(validBook);

    const userToken = await registerAndLogin({ name: 'Bob', email: 'bob@example.com', password: 'pass123' });
    const res = await request(app)
      .put(`${BASE}/${created.body._id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ title: 'Hacked', author: 'Hacker', genre: 'Fiction' });

    expect(res.status).toBe(403);
  });
});

// ─── DELETE /books/:id ────────────────────────────────────────────────────────

describe('DELETE /books/:id', () => {
  it('admin can delete a book', async () => {
    const adminToken = await registerAndLogin({ name: 'Admin', email: 'admin@example.com', password: 'pass123', role: 'admin' });
    const created = await request(app).post(BASE).set('Authorization', `Bearer ${adminToken}`).send(validBook);

    const res = await request(app).delete(`${BASE}/${created.body._id}`).set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);

    const check = await request(app).get(`${BASE}/${created.body._id}`);
    expect(check.status).toBe(404);
  });

  it('regular user cannot delete a book — returns 403', async () => {
    const adminToken = await registerAndLogin({ name: 'Admin', email: 'admin@example.com', password: 'pass123', role: 'admin' });
    const created = await request(app).post(BASE).set('Authorization', `Bearer ${adminToken}`).send(validBook);

    const userToken = await registerAndLogin({ name: 'Bob', email: 'bob@example.com', password: 'pass123' });
    const res = await request(app).delete(`${BASE}/${created.body._id}`).set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(403);
  });

  it('returns 404 when deleting a non-existent book', async () => {
    const adminToken = await registerAndLogin({ name: 'Admin', email: 'admin@example.com', password: 'pass123', role: 'admin' });

    const res = await request(app).delete(`${BASE}/000000000000000000000000`).set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
  });
});
