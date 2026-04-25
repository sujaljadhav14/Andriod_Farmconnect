const mongoose = require('mongoose');

const cropSchema = new mongoose.Schema(
  {
    cropName: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      enum: ['Grains', 'Vegetables', 'Fruits', 'Pulses', 'Spices', 'Other'],
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    unit: {
      type: String,
      required: true,
      enum: ['kg', 'quintal', 'ton', 'bag', 'piece'],
      default: 'kg',
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    qualityGrade: {
      type: String,
      required: true,
      enum: ['Grade A', 'Grade B', 'Grade C', 'Premium', 'Standard'],
    },
    description: {
      type: String,
      trim: true,
    },
    farmerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    farmerName: {
      type: String,
      required: true,
    },
    farmerPhone: {
      type: String,
      default: '',
    },
    images: {
      type: [String],
      default: [],
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
    harvestDate: {
      type: Date,
      required: true,
    },
    availableFrom: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['available', 'reserved', 'sold', 'expired'],
      default: 'available',
    },
    pesticidesUsed: {
      type: Boolean,
      default: false,
    },
    organic: {
      type: Boolean,
      default: false,
    },
    minOrderQuantity: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);
// Add indexes for better performance
cropSchema.index({ farmerId: 1 });
cropSchema.index({ category: 1 });
cropSchema.index({ status: 1 });
cropSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Crop', cropSchema);
