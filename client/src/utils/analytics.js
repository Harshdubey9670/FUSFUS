import api from '../services/api';

/**
 * Fire-and-forget analytics tracking.
 * We catch and swallow errors so that tracking failures never disrupt the UI.
 * 
 * @param {string} eventType - The type of event (e.g. 'search', 'profile_visit')
 * @param {string|null} targetId - ID of the target (e.g. userId, postId, or string for hashtag)
 * @param {object} metadata - Additional context for the event
 */
export const trackEvent = (eventType, targetId = null, metadata = {}) => {
  api.post('/api/analytics/track', {
    eventType,
    targetId,
    metadata
  }).catch(() => {
    // Silently fail telemetry so we don't spam the console or break the app
  });
};
