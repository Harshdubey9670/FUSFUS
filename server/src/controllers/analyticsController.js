const AnalyticsEvent = require('../models/AnalyticsEvent');

// @desc    Track an analytics event
// @route   POST /api/analytics/track
// @access  Private (or Public depending on needs, currently Private)
const trackEvent = async (req, res, next) => {
  try {
    const { eventType, targetId, metadata } = req.body;

    if (!eventType) {
      return res.status(400).json({ success: false, message: 'Event type is required' });
    }

    // Fire and forget, no need to await and block the response
    // But for error handling, we await it here or just create it
    const event = new AnalyticsEvent({
      eventType,
      targetId,
      metadata,
      user: req.user ? req.user.id : null // Assuming protect middleware is used
    });

    await event.save();

    // Immediately return success
    res.status(200).json({ success: true });
  } catch (error) {
    // We don't want analytics failures to break the frontend, so just log and return 200 or 500 silently
    console.error('Analytics tracking failed:', error);
    res.status(500).json({ success: false, message: 'Failed to track event' });
  }
};

module.exports = {
  trackEvent
};
