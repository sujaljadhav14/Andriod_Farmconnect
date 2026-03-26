const mongoose = require('mongoose');

const proposalSchema = new mongoose.Schema({
  cropId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Crop',
    required: true,
  },
  farmerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  traderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  priceOffered: {
    type: Number,
    required: true,
    min: 0,
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  message: {
    type: String,
    trim: true,
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'withdrawn', 'expired'],
    default: 'pending',
  },
  deliveryLocation: {
    address: String,
    city: String,
    state: String,
    pincode: String,
    coordinates: {
      latitude: Number,
      longitude: Number,
    },
  },
  proposedDeliveryDate: {
    type: Date,
    required: true,
  },
  paymentTerms: {
    type: String,
    enum: ['advance', 'on_delivery', 'partial'],
    default: 'on_delivery',
  },
  advanceAmount: {
    type: Number,
    default: 0,
  },
  rejectionReason: {
    type: String,
    trim: true,
  },
  acceptedAt: {
    type: Date,
  },
  rejectedAt: {
    type: Date,
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
  },
}, {
  timestamps: true,
});

// Add indexes for better performance
proposalSchema.index({ farmerId: 1, status: 1 });
proposalSchema.index({ traderId: 1, status: 1 });
proposalSchema.index({ cropId: 1 });
proposalSchema.index({ createdAt: -1 });
// expiresAt index is created below with TTL

// Auto-expire proposals
proposalSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Proposal', proposalSchema);