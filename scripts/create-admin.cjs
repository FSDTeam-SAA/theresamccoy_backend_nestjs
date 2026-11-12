// Explicit bootstrap operation: creates one administrator; never changes an existing user.
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
async function main() {
  const email = process.env.ADMIN_BOOTSTRAP_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD;
  if (!process.env.MONGO_URI || !email || !password || password.length < 12) throw new Error('Set MONGO_URI, ADMIN_BOOTSTRAP_EMAIL and ADMIN_BOOTSTRAP_PASSWORD (at least 12 characters).');
  await mongoose.connect(process.env.MONGO_URI);
  const users = mongoose.connection.collection('users');
  if (await users.findOne({ email })) throw new Error('Email already exists. No changes made.');
  await users.insertOne({ firstName: 'Platform', lastName: 'Admin', email, password: await bcrypt.hash(password, 12), role: 'admin', status: 'active', tokenVersion: 0, createdAt: new Date(), updatedAt: new Date() });
  console.log('Administrator created. Remove ADMIN_BOOTSTRAP_PASSWORD from your shell after use.');
}
main().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(() => mongoose.disconnect());
