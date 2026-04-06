const request = require('supertest');
const app = require('../app');
const User = require('../models/User');
const { connect, disconnect, clearDatabase } = require('./helpers/db');

const AUTH    = '/api/v1/auth';
const BOOKS   = '/api/v1/books';
const REVIEWS = '/api/v1/reviews';

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function registerAndLogin({ name, email, password, role = 'user' }) {
  const res = await request(app).post(`${AUTH}/register`).send({ name, email, password });
  if (role === 'admin') {
    await User.findByIdAndUpdate(res.body.user.id, { role: 'admin' });
    const loginRes = await request(app).post(`${AUTH}/login`).send({ email, password });
    return { token: loginRes.body.token, id: loginRes.body.user.id };
  }
  return { token: res.body.token, id: res.body.user.id };
}

async function createBook(adminToken) {
  const res = await request(app)
    .post(BOOKS)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ title: 'Dune', author: 'Frank Herbert', genre: 'Science Fiction' });
  return res.body._id;
}

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeAll(async () => { await connect(); });
afterAll(async () => { await disconnect(); });
afterEach(async () => { await clearDatabase(); });

// ─── POST /reviews/:bookId ────────────────────────────────────────────────────

describe('POST /reviews/:bookId', () => {
  it('authenticated user can submit a review — returns 201', async () => {
    const { token: adminToken } = await registerAndLogin({ name: 'Admin', email: 'admin@example.com', password: 'pass123', role: 'admin' });
    const { token: userToken } = await registerAndLogin({ name: 'Alice', email: 'alice@example.com', password: 'pass123' });
    const bookId = await createBook(adminToken);

    const res = await request(app)
      .post(`${REVIEWS}/${bookId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ rating: 5, comment: 'Fantastic book!' });

    expect(res.status).toBe(201);
    expect(res.body.rating).toBe(5);
    expect(res.body.comment).toBe('Fantastic book!');
  });

  it('unauthenticated request returns 401', async () => {
    const { token: adminToken } = await registerAndLogin({ name: 'Admin', email: 'admin@example.com', password: 'pass123', role: 'admin' });
    const bookId = await createBook(adminToken);

    const res = await request(app)
      .post(`${REVIEWS}/${bookId}`)
      .send({ rating: 4, comment: 'Great!' });

    expect(res.status).toBe(401);
  });

  it('returns 422 when rating is missing', async () => {
    const { token: adminToken } = await registerAndLogin({ name: 'Admin', email: 'admin@example.com', password: 'pass123', role: 'admin' });
    const { token: userToken } = await registerAndLogin({ name: 'Alice', email: 'alice@example.com', password: 'pass123' });
    const bookId = await createBook(adminToken);

    const res = await request(app)
      .post(`${REVIEWS}/${bookId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ comment: 'No rating here' });

    expect(res.status).toBe(422);
    expect(res.body.errors[0].field).toBe('rating');
  });

  it('returns 422 when rating is out of range', async () => {
    const { token: adminToken } = await registerAndLogin({ name: 'Admin', email: 'admin@example.com', password: 'pass123', role: 'admin' });
    const { token: userToken } = await registerAndLogin({ name: 'Alice', email: 'alice@example.com', password: 'pass123' });
    const bookId = await createBook(adminToken);

    const res = await request(app)
      .post(`${REVIEWS}/${bookId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ rating: 6 });

    expect(res.status).toBe(422);
  });
});

// ─── PUT /reviews/:id ─────────────────────────────────────────────────────────

describe('PUT /reviews/:id', () => {
  it('owner can update their own review', async () => {
    const { token: adminToken } = await registerAndLogin({ name: 'Admin', email: 'admin@example.com', password: 'pass123', role: 'admin' });
    const { token: userToken } = await registerAndLogin({ name: 'Alice', email: 'alice@example.com', password: 'pass123' });
    const bookId = await createBook(adminToken);

    const created = await request(app)
      .post(`${REVIEWS}/${bookId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ rating: 3, comment: 'Okay' });

    const res = await request(app)
      .put(`${REVIEWS}/${created.body._id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ rating: 5, comment: 'Changed my mind — amazing!' });

    expect(res.status).toBe(200);
    expect(res.body.rating).toBe(5);
    expect(res.body.comment).toBe('Changed my mind — amazing!');
  });

  it('another user cannot update someone else\'s review — returns 403', async () => {
    const { token: adminToken } = await registerAndLogin({ name: 'Admin', email: 'admin@example.com', password: 'pass123', role: 'admin' });
    const { token: aliceToken } = await registerAndLogin({ name: 'Alice', email: 'alice@example.com', password: 'pass123' });
    const { token: bobToken }   = await registerAndLogin({ name: 'Bob',   email: 'bob@example.com',   password: 'pass123' });
    const bookId = await createBook(adminToken);

    const created = await request(app)
      .post(`${REVIEWS}/${bookId}`)
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({ rating: 4, comment: 'Alice\'s review' });

    const res = await request(app)
      .put(`${REVIEWS}/${created.body._id}`)
      .set('Authorization', `Bearer ${bobToken}`)
      .send({ rating: 1, comment: 'Bob hijacking' });

    expect(res.status).toBe(403);
  });
});

// ─── DELETE /reviews/:id ──────────────────────────────────────────────────────

describe('DELETE /reviews/:id', () => {
  it('owner can delete their own review', async () => {
    const { token: adminToken } = await registerAndLogin({ name: 'Admin', email: 'admin@example.com', password: 'pass123', role: 'admin' });
    const { token: userToken }  = await registerAndLogin({ name: 'Alice', email: 'alice@example.com', password: 'pass123' });
    const bookId = await createBook(adminToken);

    const created = await request(app)
      .post(`${REVIEWS}/${bookId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ rating: 4, comment: 'Good read' });

    const res = await request(app)
      .delete(`${REVIEWS}/${created.body._id}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
  });

  it('another user cannot delete someone else\'s review — returns 403', async () => {
    const { token: adminToken } = await registerAndLogin({ name: 'Admin', email: 'admin@example.com', password: 'pass123', role: 'admin' });
    const { token: aliceToken } = await registerAndLogin({ name: 'Alice', email: 'alice@example.com', password: 'pass123' });
    const { token: bobToken }   = await registerAndLogin({ name: 'Bob',   email: 'bob@example.com',   password: 'pass123' });
    const bookId = await createBook(adminToken);

    const created = await request(app)
      .post(`${REVIEWS}/${bookId}`)
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({ rating: 4, comment: 'Alice\'s review' });

    const res = await request(app)
      .delete(`${REVIEWS}/${created.body._id}`)
      .set('Authorization', `Bearer ${bobToken}`);

    expect(res.status).toBe(403);
  });

  it('unauthenticated request returns 401', async () => {
    const { token: adminToken } = await registerAndLogin({ name: 'Admin', email: 'admin@example.com', password: 'pass123', role: 'admin' });
    const { token: userToken }  = await registerAndLogin({ name: 'Alice', email: 'alice@example.com', password: 'pass123' });
    const bookId = await createBook(adminToken);

    const created = await request(app)
      .post(`${REVIEWS}/${bookId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ rating: 4, comment: 'Good' });

    const res = await request(app).delete(`${REVIEWS}/${created.body._id}`);

    expect(res.status).toBe(401);
  });
});
