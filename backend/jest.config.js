module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  setupFiles: ['./__tests__/helpers/env.js'],
  moduleNameMapper: {
    '^ioredis$': 'ioredis-mock',
  },
  testTimeout: 30000,
};
