const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    // No +91 requirement for mobile app
    match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit mobile number'],
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  role: {
    type: String,
    enum: ['farmer', 'trader', 'transport', 'admin'],
    required: true,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  accountStatus: {
    type: String,
    enum: ['active', 'suspended', 'banned'],
    default: 'active',
  },
  accountStatusReason: {
    type: String,
    trim: true,
    default: '',
  },
  accountStatusUpdatedAt: {
    type: Date,
  },
  accountStatusUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  otp: {
    code: String,
    expiry: Date,
  },
  location: {
    address: String,
    city: String,
    state: String,
    pincode: String,
    coordinates: {
      latitude: Number,
      longitude: Number,
    },
  },
  kycStatus: {
    type: String,
    enum: ['pending', 'submitted', 'verified', 'approved', 'rejected'],
    default: 'pending',
  },
  kycDetails: {
    fullName: String,
    documentType: {
      type: String,
      enum: ['aadhaar', 'pan', 'passport', 'voter_id', 'driving_license', 'other'],
    },
    documentNumber: String,
    address: String,
    businessName: String,
    businessAddress: String,
    gstNumber: String,
    notes: String,
    idProofImage: String,
    submittedAt: Date,
    reviewedAt: Date,
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    rejectionReason: String,
  },
  bankDetails: {
    accountNumber: String,
    ifscCode: String,
    accountHolderName: String,
  },
  transportSettings: {
    schedule: {
      monday: {
        start: { type: String, default: '09:00' },
        end: { type: String, default: '18:00' },
        active: { type: Boolean, default: true },
      },
      tuesday: {
        start: { type: String, default: '09:00' },
        end: { type: String, default: '18:00' },
        active: { type: Boolean, default: true },
      },
      wednesday: {
        start: { type: String, default: '09:00' },
        end: { type: String, default: '18:00' },
        active: { type: Boolean, default: true },
      },
      thursday: {
        start: { type: String, default: '09:00' },
        end: { type: String, default: '18:00' },
        active: { type: Boolean, default: true },
      },
      friday: {
        start: { type: String, default: '09:00' },
        end: { type: String, default: '18:00' },
        active: { type: Boolean, default: true },
      },
      saturday: {
        start: { type: String, default: '10:00' },
        end: { type: String, default: '15:00' },
        active: { type: Boolean, default: true },
      },
      sunday: {
        start: { type: String, default: '' },
        end: { type: String, default: '' },
        active: { type: Boolean, default: false },
      },
    },
    supportTickets: [{
      subject: { type: String, trim: true, default: '' },
      message: { type: String, trim: true, default: '' },
      status: {
        type: String,
        enum: ['open', 'closed'],
        default: 'open',
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
      resolvedAt: Date,
    }],
    updatedAt: Date,
  },
  profileImage: String,
}, {
  timestamps: true,
});

// Hash password before saving
userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (error) {
    throw error;
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Generate OTP method
userSchema.methods.generateOTP = function () {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.otp = {
    code: otp,
    expiry: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
  };
  return otp;
};

// Verify OTP method
userSchema.methods.verifyOTP = function (code) {
  if (!this.otp.code || !this.otp.expiry) return false;
  if (this.otp.expiry < new Date()) return false;
  return this.otp.code === code;
};

module.exports = mongoose.model('User', userSchema);