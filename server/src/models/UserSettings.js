const mongoose = require('mongoose');

const userSettingsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  
  // =====================================
  // PRIVACY & SAFETY
  // =====================================
  privacy: {
    isPrivate: { type: Boolean, default: false },
    whoCanMessage: { type: String, enum: ['everyone', 'following', 'nobody'], default: 'everyone' },
    whoCanTag: { type: String, enum: ['everyone', 'following', 'nobody'], default: 'everyone' },
    whoCanMention: { type: String, enum: ['everyone', 'following', 'nobody'], default: 'everyone' },
    whoCanComment: { type: String, enum: ['everyone', 'following', 'nobody'], default: 'everyone' },
    activityStatus: { type: Boolean, default: true },
    readReceipts: { type: Boolean, default: true },
    storyPrivacy: { type: String, enum: ['everyone', 'following', 'closeFriends'], default: 'everyone' },
    storyReplies: { type: String, enum: ['everyone', 'following', 'nobody'], default: 'everyone' },
    storySharing: { type: Boolean, default: true },
    filterOffensiveComments: { type: Boolean, default: true },
    hiddenWords: [{ type: String, trim: true, lowercase: true }],
    hideFollowers: { type: Boolean, default: false },
    hideFollowing: { type: Boolean, default: false },
  },

  // =====================================
  // NOTIFICATIONS
  // =====================================
  notifications: {
    pauseAll: { type: Boolean, default: false },
    push: {
      likes: { type: Boolean, default: true },
      comments: { type: Boolean, default: true },
      mentions: { type: Boolean, default: true },
      messages: { type: Boolean, default: true },
      newFollowers: { type: Boolean, default: true },
      live: { type: Boolean, default: true },
      securityAlerts: { type: Boolean, default: true },
    },
    email: {
      marketing: { type: Boolean, default: false },
      news: { type: Boolean, default: true },
      securityAlerts: { type: Boolean, default: true },
    }
  },

  // =====================================
  // CHAT SETTINGS
  // =====================================
  chat: {
    theme: { type: String, default: 'default' }, // Hex code or name
    autoDeleteMessages: { type: Boolean, default: false },
    disappearingMode: { type: Boolean, default: false },
    screenshotDetection: { type: Boolean, default: true },
  },

  // =====================================
  // MEDIA & VAULT (Camera / Post / Archiving)
  // =====================================
  media: {
    saveOriginalPhotos: { type: Boolean, default: true },
    saveOriginalVideos: { type: Boolean, default: true },
    cameraQuality: { type: String, enum: ['standard', 'high'], default: 'high' },
    autoArchiveStories: { type: Boolean, default: true },
    autoArchivePosts: { type: Boolean, default: false },
    vaultBackup: { type: Boolean, default: true },
    watermarkDownloads: { type: Boolean, default: true },
  },

  // =====================================
  // TIME MANAGEMENT
  // =====================================
  timeManagement: {
    dailyLimitMinutes: { type: Number, default: 0 }, // 0 = unlimited
    breakReminderMinutes: { type: Number, default: 0 },
    quietMode: { type: Boolean, default: false },
    quietModeStart: { type: String, default: '22:00' },
    quietModeEnd: { type: String, default: '07:00' },
  },

  // =====================================
  // ACCESSIBILITY & DISPLAY
  // =====================================
  accessibility: {
    theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
    highContrast: { type: Boolean, default: false },
    reduceMotion: { type: Boolean, default: false },
    fontSize: { type: String, enum: ['small', 'medium', 'large'], default: 'medium' },
  },

  // =====================================
  // LANGUAGE
  // =====================================
  language: {
    preferred: { type: String, default: 'en' }, // ISO code
    autoTranslate: { type: Boolean, default: false },
  },

  // =====================================
  // AI SETTINGS
  // =====================================
  ai: {
    enableAiFeatures: { type: Boolean, default: true },
    aiCaptionGenerator: { type: Boolean, default: true },
    aiRecommendations: { type: Boolean, default: true },
    aiMemories: { type: Boolean, default: true },
  },

  // =====================================
  // SECURITY & LOCATION
  // =====================================
  security: {
    twoFactorEnabled: { type: Boolean, default: false },
    biometricLock: { type: Boolean, default: false },
    ghostMode: { type: Boolean, default: false }, // Hides location completely
    shareLocation: { type: Boolean, default: true },
  }

}, {
  timestamps: true,
  minimize: false // Ensure empty objects are not stripped
});

const UserSettings = mongoose.model('UserSettings', userSettingsSchema);
module.exports = UserSettings;
