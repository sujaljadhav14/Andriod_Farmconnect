const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true,
    },
    payerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    payeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    type: {
        type: String,
        enum: ['booking_payment', 'advance_payment', 'full_payment', 'settlement', 'refund'],
        default: 'full_payment',
    },
    amount: {
        type: Number,
        required: true,
        min: 0,
    },
    currency: {
        type: String,
        default: 'INR',
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'completed',
    },
    paymentMethod: {
        type: String,
        enum: ['upi', 'bank_transfer', 'cash', 'cheque'],
        default: 'upi',
    },
    gateway: {
        type: String,
        enum: ['dummy'],
        default: 'dummy',
    },
    referenceNumber: {
        type: String,
        unique: true,
        sparse: true,
    },
    notes: {
        type: String,
        trim: true,
        maxlength: 500,
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
    },
    completedAt: {
        type: Date,
    },
    failureReason: {
        type: String,
        trim: true,
    },
}, {
    timestamps: true,
});

transactionSchema.pre('save', function (next) {
    if (!this.referenceNumber && this.isNew) {
        const ts = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).slice(2, 8).toUpperCase();
        this.referenceNumber = `TXN-${ts}-${random}`;
    }

    if (this.status === 'completed' && !this.completedAt) {
        this.completedAt = new Date();
    }

    next();
});

transactionSchema.index({ orderId: 1, createdAt: -1 });
transactionSchema.index({ payerId: 1, createdAt: -1 });
transactionSchema.index({ payeeId: 1, createdAt: -1 });
transactionSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Transaction', transactionSchema);
