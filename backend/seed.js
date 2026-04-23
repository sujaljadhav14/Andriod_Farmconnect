/**
 * FarmConnect — Database Seed Script
 * -----------------------------------
 * Creates test users and dummy crop data for testing
 * Admin, Farmer, Trader, Transport users + crops
 *
 * Run with:  node seed.js
 * Reset all: node seed.js --reset
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const mongoose = require('mongoose');
const User = require('./models/User');
const Crop = require('./models/Crop');

// ============================================================
//  TEST USER CREDENTIALS
// ============================================================
const TEST_USERS = [
  {
    name: 'Admin User',
    phone: '9000000001',
    password: 'Admin@123',
    role: 'admin',
    city: 'Mumbai',
    state: 'Maharashtra',
    latitude: 19.0760,
    longitude: 72.8777,
  },
  {
    name: 'Ramesh Patil',
    phone: '9000000002',
    password: 'Farmer@123',
    role: 'farmer',
    city: 'Pune',
    state: 'Maharashtra',
    latitude: 18.5204,
    longitude: 73.8567,
  },
  {
    name: 'Rajesh Gupta',
    phone: '9000000003',
    password: 'Trader@123',
    role: 'trader',
    city: 'Nashik',
    state: 'Maharashtra',
    latitude: 19.9974,
    longitude: 73.7898,
  },
  {
    name: 'Test Transporter',
    phone: '9000000004',
    password: 'Transport@123',
    role: 'transport',
    city: 'Nagpur',
    state: 'Maharashtra',
    latitude: 21.1458,
    longitude: 79.0882,
  },
];

// ============================================================
//  DUMMY CROP DATA (for farmer 9000000002)
// ============================================================
const getDummyCrops = (farmerId) => [
  {
    cropName: 'Wheat',
    category: 'Grains',
    variety: 'HD 2967',
    description: 'High-yielding wheat variety with disease resistance',
    quantity: 500,
    unit: 'kg',
    price: 2500,
    qualityGrade: 'Grade A',
    status: 'available',
    farmerId,
    locationDetails: {
      village: 'Dhankawadi',
      tehsil: 'Pune',
      district: 'Pune',
      state: 'Maharashtra',
      pincode: '411043',
    },
    harvestDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    expectedHarvestDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    cultivationDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
    pesticidesUsed: false,
    organic: true,
    minOrderQuantity: 50,
  },
  {
    cropName: 'Tomato',
    category: 'Vegetables',
    variety: 'Hybrid Hy-2001',
    description: 'Fresh, juicy tomatoes perfect for market',
    quantity: 800,
    unit: 'kg',
    price: 3500,
    qualityGrade: 'Grade A',
    status: 'available',
    farmerId,
    locationDetails: {
      village: 'Dhankawadi',
      tehsil: 'Pune',
      district: 'Pune',
      state: 'Maharashtra',
      pincode: '411043',
    },
    harvestDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    expectedHarvestDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    cultivationDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
    pesticidesUsed: true,
    organic: false,
    minOrderQuantity: 100,
  },
  {
    cropName: 'Onion',
    category: 'Vegetables',
    variety: 'N53',
    description: 'Premium quality red onions',
    quantity: 1200,
    unit: 'kg',
    price: 1800,
    qualityGrade: 'Grade B',
    status: 'available',
    farmerId,
    locationDetails: {
      village: 'Dhankawadi',
      tehsil: 'Pune',
      district: 'Pune',
      state: 'Maharashtra',
      pincode: '411043',
    },
    harvestDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    expectedHarvestDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    cultivationDate: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
    pesticidesUsed: true,
    organic: false,
    minOrderQuantity: 200,
  },
];

// ============================================================

async function seed() {
  const isReset = process.argv.includes('--reset');

  console.log('\n🌱  FarmConnect — Seed Script with Crops');
  console.log('=========================================\n');

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅  MongoDB connected\n');
  } catch (err) {
    console.error('❌  MongoDB connection failed:', err.message);
    process.exit(1);
  }

  if (isReset) {
    const phones = TEST_USERS.map(u => u.phone);
    await User.deleteMany({ phone: { $in: phones } });
    await Crop.deleteMany({}); // Clear all crops
    console.log(`🔄  Reset: Cleared database\n`);
  }

  const results = [];
  let farmerId = null;

  // Create users
  for (const userData of TEST_USERS) {
    const existing = await User.findOne({ phone: userData.phone });

    if (existing) {
      if (existing.role !== userData.role) {
        existing.role = userData.role;
        await existing.save();
        console.log(`🔧  Fixed role for ${userData.name} → ${userData.role}`);
      } else {
        console.log(`⏭️   Skipped: ${userData.name} [${userData.role}]`);
      }
      if (existing.role === 'farmer') farmerId = existing._id;
      results.push({ ...userData, status: 'existing' });
      continue;
    }

    const user = new User({
      name: userData.name,
      phone: userData.phone,
      password: userData.password,
      role: userData.role,
      isVerified: true,
      kycStatus: 'pending',
      location: {
        city: userData.city,
        state: userData.state,
      },
      coordinates: {
        latitude: userData.latitude,
        longitude: userData.longitude,
      },
    });

    await user.save();
    console.log(`✅  Created: ${userData.name} [${userData.role}]`);
    if (user.role === 'farmer') farmerId = user._id;
    results.push({ ...userData, status: 'created', id: user._id });
  }

// Create crops for farmer
  if (farmerId) {
    console.log('\n📦  Creating dummy crops for farmer...\n');
    
    // Get farmer details for crop fields
    const farmerUser = await User.findById(farmerId);
    if (!farmerUser) {
      console.error('❌  Farmer user not found');
    } else {
      const crops = getDummyCrops(farmerId);
      
      for (const cropData of crops) {
        const existing = await Crop.findOne({ 
          cropName: cropData.cropName, 
          farmerId 
        });

        if (!existing) {
          // Add farmer details required by schema
          cropData.farmerName = farmerUser.name;
          cropData.farmerPhone = farmerUser.phone;
          
          await Crop.create(cropData);
          console.log(`✅  Created crop: ${cropData.cropName} (${cropData.quantity} ${cropData.unit})`);
        } else {
          console.log(`⏭️   Crop exists: ${cropData.cropName}`);
        }
      }
    }
  }

  // Print credentials
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║            TEST CREDENTIALS (Login to App)                   ║');
  console.log('╠════════════════╦═════════════╦════════════╦══════════════════╣');
  console.log('║ Role           ║ Phone       ║ Password   ║ Status           ║');
  console.log('╠════════════════╬═════════════╬════════════╬══════════════════╣');
  
  const testAccounts = [
    { role: 'Admin', phone: '9000000001', pass: 'Admin@123' },
    { role: 'Farmer', phone: '9000000002', pass: 'Farmer@123' },
    { role: 'Trader', phone: '9000000003', pass: 'Trader@123' },
    { role: 'Transport', phone: '9000000004', pass: 'Transport@123' },
  ];

  for (const acc of testAccounts) {
    console.log(`║ ${acc.role.padEnd(14)} ║ ${acc.phone.padEnd(11)} ║ ${acc.pass.padEnd(10)} ║ Ready to test    ║`);
  }
  
  console.log('╚════════════════╩═════════════╩════════════╩══════════════════╝\n');
  console.log('📝  All users are pre-verified\n');
  console.log('🔄  To reset: node seed.js --reset\n');

  await mongoose.disconnect();
  console.log('✅  Seed complete!\n');
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
