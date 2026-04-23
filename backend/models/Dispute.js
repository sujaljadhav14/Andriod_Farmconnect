const mongoose = require('mongoose');

const disputeEvidenceSchema = new mongoose.Schema({
  fileUrl: {
    type: String,
    default: '',
  },
  note: {
    type: String,
    trim: true,
    default: '',
    maxlength: 1000,
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
}, { _id: false });

const disputeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 160,
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 3000,
  },
  category: {
    type: String,
    enum: ['payment', 'quality', 'delivery', 'agreement', 'other'],
    default: 'other',
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
  },
  status: {
    type: String,
    enum: ['open', 'in_review', 'resolved', 'rejected', 'closed'],
    default: 'open',
  },
  raisedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  againstUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
  },
  proposalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Proposal',
  },
  evidence: {
    type: [disputeEvidenceSchema],
    default: [],
  },
  resolution: {
    note: {
      type: String,
      trim: true,
      default: '',
      maxlength: 2000,
    },
    action: {
      type: String,
      trim: true,
      default: '',
      maxlength: 200,
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    resolvedAt: {
      type: Date,
    },
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

disputeSchema.index({ status: 1, createdAt: -1 });
disputeSchema.index({ raisedBy: 1, createdAt: -1 });
disputeSchema.index({ againstUser: 1, createdAt: -1 });
disputeSchema.index({ orderId: 1, createdAt: -1 });
disputeSchema.index({ priority: 1, status: 1 });

module.exports = mongoose.model('Dispute', disputeSchema);
