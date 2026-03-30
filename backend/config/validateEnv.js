const REQUIRED = [
  'MONGO_URI',
  'JWT_SECRET',
  'FRONTEND_URL',
  'SMTP_HOST',
  'SMTP_USER',
  'SMTP_PASS',
];

function validateEnv() {
  const missing = REQUIRED.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error(`[env] Missing required environment variables:\n  ${missing.join('\n  ')}`);
    console.error('[env] Check .env.example for reference.');
    process.exit(1);
  }
}

module.exports = validateEnv;
