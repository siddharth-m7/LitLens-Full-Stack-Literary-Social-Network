/**
 * Minimal seed for E2E tests.
 * Creates admin@example.com / admin123 if not already in the DB.
 * Run with: node backend/scripts/seedE2E.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);

  const existing = await User.findOne({ email: 'admin@example.com' });
  if (!existing) {
    const hash = await bcrypt.hash('admin123', 10);
    await User.create({ name: 'Admin', email: 'admin@example.com', password: hash, role: 'admin' });
    console.log('✅ E2E admin user created (admin@example.com / admin123)');
  } else {
    console.log('ℹ️  E2E admin user already exists');
  }

  await mongoose.disconnect();
}

seed().catch((err) => { console.error(err); process.exit(1); });
