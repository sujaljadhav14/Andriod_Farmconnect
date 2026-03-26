const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  proposalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Proposal',
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
  cropId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Crop',
    required: true,
  },
  orderNumber: {
    type: String,
    unique: true,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  unit: {
    type: String,
    required: true,
  },
  pricePerUnit: {
    type: Number,
    required: true,
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: [
      'confirmed',
      'payment_pending',
      'payment_received',
      'ready_for_pickup',
      'in_transit',
      'delivered',
      'completed',
      'cancelled'
    ],
    default: 'confirmed',
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'partial', 'paid', 'refunded'],
    default: 'pending',
  },
  paymentDetails: {
    method: {
      type: String,
      enum: ['cash', 'bank_transfer', 'upi', 'cheque'],
    },
    transactionId: String,
    paidAmount: {
      type: Number,
      default: 0,
    },
    paidAt: Date,
  },
  deliveryDetails: {
    address: String,
    city: String,
    state: String,
    pincode: String,
    coordinates: {
      latitude: Number,
      longitude: Number,
    },
    scheduledDate: Date,
    actualDate: Date,
    contactPerson: String,
    contactPhone: String,
  },
  farmingDetails: {
    harvestDate: Date,
    qualityGrade: String,
    pesticidesUsed: Boolean,
    organic: Boolean,
  },
  transportDetails: {
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    vehicleNumber: String,
    pickupTime: Date,
    deliveryTime: Date,
    trackingId: String,
  },
  statusHistory: [{
    status: String,
    timestamp: {
      type: Date,
      default: Date.now,
    },
    note: String,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  }],
  cancellationReason: String,
  cancelledAt: Date,
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  notes: {
    farmer: String,
    trader: String,
    transport: String,
  },
}, {
  timestamps: true,
});

// Generate order number before saving
orderSchema.pre('save', async function (next) {
  if (this.isNew && !this.orderNumber) {
    const count = await this.constructor.countDocuments();
    this.orderNumber = `FC${Date.now().toString().slice(-6)}${(count + 1).toString().padStart(4, '0')}`;
  }
  next();
});

// Add status to history on status change
orderSchema.pre('save', function (next) {
  if (this.isModified('status')) {
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date(),
      note: `Status changed to ${this.status}`,
    });
  }
  next();
});

// Add indexes for better performance
orderSchema.index({ farmerId: 1, status: 1 });
orderSchema.index({ traderId: 1, status: 1 });
// orderNumber index is automatically created due to unique: true
orderSchema.index({ createdAt: -1 });
orderSchema.index({ 'transportDetails.driverId': 1 });

module.exports = mongoose.model('Order', orderSchema);