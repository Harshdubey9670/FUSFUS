const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Post must belong to a user'],
    index: true // Optimization: fast query by user
  },
  caption: {
    type: String,
    trim: true,
    maxlength: [2200, 'Caption cannot exceed 2200 characters'],
    default: '',
  },
  status: {
    type: String,
    enum: ['published', 'archived', 'draft', 'scheduled'],
    default: 'published'
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  settings: {
    commentsEnabled: { type: Boolean, default: true },
    hideLikes: { type: Boolean, default: false },
    sharingEnabled: { type: Boolean, default: true }
  },
  scheduledAt: {
    type: Date
  },
  location: {
    type: String,
    trim: true,
    default: '',
  },
  audio: {
    type: String,
    trim: true,
    default: '',
  },
  media: [{
    url: {
      type: String,
      required: [true, 'Media URL is required']
    },
    public_id: {
      type: String,
    },
    type: {
      type: String,
      enum: ['image', 'video'],
      default: 'image'
    },
    altText: {
      type: String,
      trim: true,
      maxlength: [200, 'Alt text cannot exceed 200 characters'],
      default: ''
    }
  }],
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  saves: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  comments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
  }],
  commentsCount: {
    type: Number,
    default: 0,
  },
  hashtags: [{
    type: String,
    lowercase: true,
    trim: true
  }],
  mentions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true // automatically adds createdAt and updatedAt
});

// Indexes for optimization
// Sort feed by newest posts
postSchema.index({ createdAt: -1 });

// Optimize querying a specific user's posts sorted by newest
postSchema.index({ user: 1, createdAt: -1 });

// Optimize querying by hashtag
postSchema.index({ hashtags: 1 });
postSchema.index({ hashtags: 1, createdAt: -1 });

const Post = mongoose.model('Post', postSchema);
module.exports = Post;
