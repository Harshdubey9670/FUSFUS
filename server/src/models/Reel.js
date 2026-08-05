const mongoose = require('mongoose');

const reelSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reel must belong to a user'],
      index: true,
    },
    caption: {
      type: String,
      trim: true,
      maxlength: [2200, 'Caption cannot exceed 2200 characters'],
      default: '',
    },
    video: {
      url: {
        type: String,
        required: [true, 'Video URL is required'],
      },
      public_id: {
        type: String,
      },
      // Duration in seconds — populated during upload for seek bar rendering
      duration: {
        type: Number,
        default: 0,
      },
      // Resolution metadata for adaptive rendering
      width: {
        type: Number,
      },
      height: {
        type: Number,
      },
      // Poster/thumbnail image for fast first-frame render before video loads
      thumbnailUrl: {
        type: String,
      },
    },
    music: {
      title: {
        type: String,
        trim: true,
        default: '',
      },
      artist: {
        type: String,
        trim: true,
        default: '',
      },
      // URL to external audio track or Cloudinary audio asset
      audioUrl: {
        type: String,
        default: '',
      },
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    comments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment',
      },
    ],
    commentsCount: {
      type: Number,
      default: 0,
    },
    shares: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    // Track view count for trending algorithm
    viewsCount: {
      type: Number,
      default: 0,
    },
    hashtags: [
      {
        type: String,
        lowercase: true,
        trim: true,
      },
    ],
    mentions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    status: {
      type: String,
      enum: ['published', 'draft', 'scheduled', 'archived'],
      default: 'published',
    },
    scheduledAt: {
      type: Date,
    },
    isRemix: {
      type: Boolean,
      default: false,
    },
    originalReel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Reel',
    },
    collaborators: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    downloadAllowed: {
      type: Boolean,
      default: false, // Default DRM download prevention architecture
    },
    editingMetadata: {
      speed: { type: Number, default: 1.0 },
      filter: { type: String, default: 'none' },
      effect: { type: String, default: 'none' },
      trimStart: { type: Number, default: 0 },
      trimEnd: { type: Number, default: 0 },
      voiceoverUrl: { type: String, default: '' },
      templateId: { type: String, default: '' }
    },
    aiCaptions: [
      {
        timestamp: { type: String },
        text: { type: String }
      }
    ],
    analytics: {
      watchTimeSeconds: { type: Number, default: 0 },
      replayCount: { type: Number, default: 0 },
      retentionRate: { type: Number, default: 85 }
    }
  },
  {
    timestamps: true,
    // Enable virtual fields (e.g. for likesCount computed field)
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Virtuals ────────────────────────────────────────────────────────────────
// Compute likesCount on the fly so we never have a stale integer field
reelSchema.virtual('likesCount').get(function () {
  return this.likes?.length ?? 0;
});

// ─── Indexes (optimised for video feed) ──────────────────────────────────────

// Primary feed query: newest reels first
reelSchema.index({ createdAt: -1 });

// User profile page: all reels by a user, newest first
reelSchema.index({ user: 1, createdAt: -1 });

// Trending algorithm: most liked + most viewed
reelSchema.index({ viewsCount: -1, createdAt: -1 });

// Hashtag browsing
reelSchema.index({ hashtags: 1, createdAt: -1 });

const Reel = mongoose.model('Reel', reelSchema);
module.exports = Reel;
