const mongoose = require('mongoose');

const analyticsEventSchema = new mongoose.Schema({
  eventType: {
    type: String,
    enum: ['search', 'trending_click', 'profile_visit', 'hashtag_visit', 'recommendation_click', 'post_view'],
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Allow anonymous tracking if needed later, but currently assume logged in
  },
  targetId: {
    type: String, // String to accommodate ObjectIds OR hashtag strings
    required: false
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt
});

// Index for fast querying by date and event type for admin dashboard
analyticsEventSchema.index({ eventType: 1, createdAt: -1 });
analyticsEventSchema.index({ user: 1, createdAt: -1 });

const AnalyticsEvent = mongoose.model('AnalyticsEvent', analyticsEventSchema);

module.exports = AnalyticsEvent;
