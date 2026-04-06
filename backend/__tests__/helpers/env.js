// Set env vars before any module is imported in tests
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-jest';
process.env.FRONTEND_URL = 'http://localhost:5173';
process.env.REDIS_URL = '';
