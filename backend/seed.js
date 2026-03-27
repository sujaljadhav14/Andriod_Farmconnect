/**
 * FarmConnect — Database Seed Script
 * -----------------------------------
 * Creates one verified test user for each role:
 *   Admin, Farmer, Trader, Transport
 *
 * Run with:  node seed.js
 *
 * It will SKIP users that already exist (safe to re-run).
 * To RESET and recreate all users, run:  node seed.js --reset
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const mongoose = require('mongoose');
const User = require('./models/User');

// ============================================================
//  TEST USER CREDENTIALS  (copy these to test the app)
// ============================================================
const TEST_USERS = [
  {
    name: 'Admin User',
    phone: '9000000001',
    password: 'Admin@123',
    role: 'admin',
    city: 'Mumbai',
    state: 'Maharashtra',
  },
  {
    name: 'Test Farmer',
    phone: '9000000002',
    password: 'Farmer@123',
    role: 'farmer',
    city: 'Pune',
    state: 'Maharashtra',
  },
  {
    name: 'Test Trader',
    phone: '9000000003',
    password: 'Trader@123',
    role: 'trader',
    city: 'Nashik',
    state: 'Maharashtra',
  },
  {
    name: 'Test Transporter',
    phone: '9000000004',
    password: 'Transport@123',
    role: 'transport',
    city: 'Nagpur',
    state: 'Maharashtra',
  },
];

// ============================================================

async function seed() {
  const isReset = process.argv.includes('--reset');

  console.log('\n🌱  FarmConnect — Seed Script');
  console.log('================================\n');

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅  MongoDB connected:', process.env.MONGO_URI, '\n');
  } catch (err) {
    console.error('❌  MongoDB connection failed:', err.message);
    process.exit(1);
  }

  if (isReset) {
    const phones = TEST_USERS.map(u => u.phone);
    const result = await User.deleteMany({ phone: { $in: phones } });
    console.log(`🔄  Reset: Deleted ${result.deletedCount} existing test users.\n`);
  }

  const results = [];

  for (const userData of TEST_USERS) {
    const existing = await User.findOne({ phone: userData.phone });

    if (existing) {
      // If role is wrong (e.g. was changed manually), fix it
      if (existing.role !== userData.role) {
        existing.role = userData.role;
        await existing.save();
        console.log(`🔧  Fixed role for ${userData.name} (${userData.phone}) → ${userData.role}`);
      } else {
        console.log(`⏭️   Skipped (already exists): ${userData.name} [${userData.role}] — ${userData.phone}`);
      }
      results.push({ ...userData, status: 'existing' });
      continue;
    }

    // Create new user — password is auto-hashed by User model pre('save')
    const user = new User({
      name: userData.name,
      phone: userData.phone,
      password: userData.password,
      role: userData.role,
      isVerified: true,          // Pre-verified so no OTP needed
      kycStatus: 'pending',
      location: {
        city: userData.city,
        state: userData.state,
      },
    });

    await user.save();
    console.log(`✅  Created: ${userData.name} [${userData.role}] — ${userData.phone}`);
    results.push({ ...userData, status: 'created' });
  }

  // Print credentials table
  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║              TEST CREDENTIALS (save these!)                     ║');
  console.log('╠══════════════╦══════════════╦═══════════════╦═══════════════════╣');
  console.log('║ Role         ║ Phone        ║ Password      ║ Status            ║');
  console.log('╠══════════════╬══════════════╬═══════════════╬═══════════════════╣');
  for (const u of results) {
    const role     = u.role.padEnd(12);
    const phone    = u.phone.padEnd(12);
    const password = u.password.padEnd(13);
    const status   = u.status === 'created' ? '✅ Created' : '⏭️  Already existed';
    console.log(`║ ${role} ║ ${phone} ║ ${password} ║ ${status.padEnd(17)} ║`);
  }
  console.log('╚══════════════╩══════════════╩═══════════════╩═══════════════════╝');
  console.log('\n📱  All users are pre-verified — no OTP needed to log in.');
  console.log('🔄  To reset and recreate: node seed.js --reset\n');

  await mongoose.disconnect();
  console.log('✅  Done. MongoDB disconnected.\n');
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
