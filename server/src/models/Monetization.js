const mongoose = require('mongoose');

// --- Creator Subscription Schema ---
const subscriptionSchema = new mongoose.Schema({
  subscriber: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tier: {
    type: String,
    enum: ['tier1', 'tier2', 'tier3', 'vip'],
    default: 'tier1'
  },
  price: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'canceled', 'expired'],
    default: 'active'
  },
  renewsAt: {
    type: Date,
    required: true
  }
}, { timestamps: true });

// --- Tip / Support Schema ---
const tipSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  message: {
    type: String,
    default: ''
  }
}, { timestamps: true });

// --- Badge Purchase Schema ---
const badgeSchema = new mongoose.Schema({
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  badgeType: {
    type: String,
    enum: ['supporter', 'superfan', 'vip_patron'],
    default: 'supporter'
  },
  price: {
    type: Number,
    required: true
  }
}, { timestamps: true });

// --- Affiliate Link Schema ---
const affiliateLinkSchema = new mongoose.Schema({
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  clicks: {
    type: Number,
    default: 0
  },
  earnings: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

// --- Payout Request Schema ---
const payoutSchema = new mongoose.Schema({
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['bank_transfer', 'paypal', 'stripe'],
    default: 'bank_transfer'
  },
  requestedAt: {
    type: Date,
    default: Date.now
  },
  processedAt: {
    type: Date
  }
}, { timestamps: true });

// --- Tax Info Placeholder Schema ---
const taxInfoSchema = new mongoose.Schema({
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  legalName: {
    type: String,
    required: true
  },
  taxIdType: {
    type: String,
    enum: ['SSN', 'EIN', 'VAT', 'PAN', 'OTHER'],
    default: 'SSN'
  },
  taxIdMasked: {
    type: String,
    required: true
  },
  country: {
    type: String,
    default: 'United States'
  },
  status: {
    type: String,
    enum: ['unverified', 'verified', 'rejected'],
    default: 'verified'
  }
}, { timestamps: true });

const Subscription = mongoose.model('Subscription', subscriptionSchema);
const Tip = mongoose.model('Tip', tipSchema);
const Badge = mongoose.model('Badge', badgeSchema);
const AffiliateLink = mongoose.model('AffiliateLink', affiliateLinkSchema);
const Payout = mongoose.model('Payout', payoutSchema);
const TaxInfo = mongoose.model('TaxInfo', taxInfoSchema);

module.exports = {
  Subscription,
  Tip,
  Badge,
  AffiliateLink,
  Payout,
  TaxInfo
};
