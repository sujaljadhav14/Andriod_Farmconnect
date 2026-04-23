const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  farmerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 120,
  },
  description: {
    type: String,
    trim: true,
    default: '',
    maxlength: 500,
  },
  category: {
    type: String,
    enum: ['Sowing', 'Irrigation', 'Fertilizing', 'Harvesting', 'Maintenance', 'Other'],
    default: 'Other',
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
  },
  status: {
    type: String,
    enum: ['pending', 'completed'],
    default: 'pending',
  },
  dueDate: {
    type: Date,
    required: true,
  },
  reminderAt: {
    type: Date,
  },
  completedAt: {
    type: Date,
  },
  notes: {
    type: String,
    trim: true,
    default: '',
    maxlength: 500,
  },
}, {
  timestamps: true,
});

taskSchema.index({ farmerId: 1, dueDate: 1 });
taskSchema.index({ farmerId: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('Task', taskSchema);
