const mongoose = require('mongoose');

const signatureSchema = new mongoose.Schema({
    signed: {
        type: Boolean,
        default: false,
    },
    signedAt: {
        type: Date,
    },
    digitalSignature: {
        type: String,
        trim: true,
    },
    acceptedTerms: {
        type: Boolean,
        default: false,
    },
}, {
    _id: false,
});

const agreementSchema = new mongoose.Schema({
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true,
        unique: true,
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
    generatedAfterTransaction: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transaction',
    },
    documentNumber: {
        type: String,
        unique: true,
        sparse: true,
    },
    title: {
        type: String,
        default: 'FarmConnect Produce Trade Agreement',
    },
    documentBody: {
        type: String,
        default: '',
    },
    terms: {
        cropName: String,
        quantity: Number,
        unit: String,
        pricePerUnit: Number,
        totalAmount: Number,
        paymentMethod: String,
        paymentReference: String,
        deliveryAddress: String,
        deliveryCity: String,
        deliveryState: String,
        deliveryPincode: String,
        agreedOn: Date,
    },
    farmerSignature: {
        type: signatureSchema,
        default: () => ({}),
    },
    traderSignature: {
        type: signatureSchema,
        default: () => ({}),
    },
    status: {
        type: String,
        enum: ['pending_farmer', 'pending_trader', 'completed', 'cancelled'],
        default: 'pending_farmer',
    },
    completedAt: {
        type: Date,
    },
    cancelledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    cancellationReason: {
        type: String,
        trim: true,
    },
    cancelledAt: {
        type: Date,
    },
}, {
    timestamps: true,
});

agreementSchema.pre('save', function (next) {
    if (!this.documentNumber && this.isNew) {
        const ts = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).slice(2, 7).toUpperCase();
        this.documentNumber = `AGR-${ts}-${random}`;
    }

    if (this.status === 'completed' && !this.completedAt) {
        this.completedAt = new Date();
    }

    next();
});

agreementSchema.index({ farmerId: 1, status: 1 });
agreementSchema.index({ traderId: 1, status: 1 });

module.exports = mongoose.model('Agreement', agreementSchema);
