const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
  },
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
  },
  password: {
    type: String,
    required: [function() { return !this.googleId; }, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false, // Don't return password by default
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true,
  },
  profilePicture: {
    type: String,
    default: '',
  },
  avatar: {
    type: String,
    default: '',
  },
  phone: {
    type: String,
    trim: true,
    match: [/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number'],
  },
  bio: {
    type: String,
    trim: true,
    maxlength: [150, 'Bio cannot exceed 150 characters'],
    default: '',
  },
  pronouns: {
    type: String,
    trim: true,
    maxlength: [20, 'Pronouns cannot exceed 20 characters'],
    default: '',
  },
  coverPhoto: {
    type: String,
    default: '',
  },
  socialLinks: [{
    platform: { type: String, trim: true },
    url: { type: String, trim: true },
    title: { type: String, trim: true }
  }],
  dateOfBirth: {
    type: Date,
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Custom', 'Prefer not to say', ''],
    default: '',
  },
  website: {
    type: String,
    trim: true,
    default: '',
  },
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  savedPosts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  }],
  hiddenPosts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  }],
  blockedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  mutedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  closeFriends: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  collections: [{
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: [50, 'Collection name cannot exceed 50 characters']
    },
    posts: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post'
    }],
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  searchHistory: [{
    query: { type: String, required: true },
    type: { type: String, enum: ['user', 'hashtag', 'text'], default: 'text' },
    refId: { type: mongoose.Schema.Types.ObjectId },
    isPinned: { type: Boolean, default: false },
    timestamp: { type: Date, default: Date.now },
    username: String,
    fullName: String,
    avatar: String,
    tag: String
  }],
  isVerified: {
    type: Boolean,
    default: false,
  },
  otp: {
    type: String,
  },
  otpExpires: {
    type: Date,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  accountType: {
    type: String,
    enum: ['personal', 'creator', 'business'],
    default: 'personal'
  },
  category: {
    type: String,
    trim: true,
    default: ''
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  followRequests: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  restrictedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  verificationRequestStatus: {
    type: String,
    enum: ['none', 'pending', 'approved', 'rejected'],
    default: 'none'
  },
  sessions: [{
    token: { type: String, required: true },
    deviceString: { type: String, default: 'Unknown Device' },
    ip: { type: String, default: 'Unknown IP' },
    lastActive: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

// Pre-save hook to hash password
userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);
module.exports = User;
