const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema(
  {
    transporterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    vehicleType: {
      type: String,
      required: true,
      trim: true,
      enum: ['Truck', 'Mini Truck', 'Tempo', 'Pickup', 'Other'],
    },
    vehicleNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      unique: true,
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
    },
    capacityUnit: {
      type: String,
      enum: ['kg', 'ton'],
      default: 'kg',
    },
    model: {
      type: String,
      trim: true,
      default: '',
    },
    year: {
      type: Number,
      min: 1990,
      max: 2100,
    },
    availabilityStatus: {
      type: String,
      enum: ['available', 'on_delivery', 'maintenance', 'inactive'],
      default: 'available',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

vehicleSchema.index({ transporterId: 1, availabilityStatus: 1 });
vehicleSchema.index({ transporterId: 1, createdAt: -1 });

module.exports = mongoose.model('Vehicle', vehicleSchema);
