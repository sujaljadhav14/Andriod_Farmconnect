const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const communityPostSchema = new mongoose.Schema({
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1500,
  },
  cropCategory: {
    type: String,
    enum: ['General', 'Grains', 'Vegetables', 'Fruits', 'Pulses', 'Spices', 'Other'],
    default: 'General',
  },
  tags: {
    type: [String],
    default: [],
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  comments: {
    type: [commentSchema],
    default: [],
  },
  isPinned: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

communityPostSchema.index({ isActive: 1, isPinned: -1, createdAt: -1 });
communityPostSchema.index({ cropCategory: 1, createdAt: -1 });
communityPostSchema.index({ authorId: 1, createdAt: -1 });

module.exports = mongoose.model('CommunityPost', communityPostSchema);
