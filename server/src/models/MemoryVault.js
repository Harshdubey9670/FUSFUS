const mongoose = require('mongoose');

// --- Memory Schema ---
const memorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    trim: true,
    default: ''
  },
  mediaUrl: {
    type: String,
    required: true
  },
  mediaType: {
    type: String,
    enum: ['image', 'video'],
    default: 'image'
  },
  album: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VaultAlbum'
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  isHidden: {
    type: Boolean,
    default: false
  },
  isFavorite: {
    type: Boolean,
    default: false
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date
  },
  encryptedMetadata: {
    type: String,
    default: ''
  },
  memoryDate: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Compound Indexes for fast memory timeline queries
memorySchema.index({ user: 1, isDeleted: 1, memoryDate: -1 });
memorySchema.index({ user: 1, isFavorite: 1 });

// --- Vault Album Schema ---
const vaultAlbumSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  coverImage: {
    type: String,
    default: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=400&auto=format&fit=crop'
  },
  isPrivate: {
    type: Boolean,
    default: true
  },
  isHidden: {
    type: Boolean,
    default: false
  },
  pinHash: {
    type: String,
    default: ''
  }
}, { timestamps: true });

// --- Vault Security & Backup Settings Schema ---
const vaultSecuritySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  pinHash: {
    type: String,
    default: ''
  },
  biometricEnabled: {
    type: Boolean,
    default: true
  },
  autoBackupEnabled: {
    type: Boolean,
    default: true
  },
  lastBackupAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

const Memory = mongoose.model('Memory', memorySchema);
const VaultAlbum = mongoose.model('VaultAlbum', vaultAlbumSchema);
const VaultSecurity = mongoose.model('VaultSecurity', vaultSecuritySchema);

module.exports = {
  Memory,
  VaultAlbum,
  VaultSecurity
};
