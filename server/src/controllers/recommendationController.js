const RecommendationService = require('../services/RecommendationService');

// @desc    Get all personalized recommendations (Users, Posts, Reels, Hashtags)
// @route   GET /api/recommendations
// @access  Private
const getPersonalizedRecommendations = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Build the dynamic affinity profile based on recent activity
    const profile = await RecommendationService.buildAffinityProfile(userId);

    // Fetch all recommendations in parallel for speed
    const [users, posts, reels, hashtags] = await Promise.all([
      RecommendationService.getRecommendedUsers(profile, 8),
      RecommendationService.getRecommendedPosts(profile, 15),
      RecommendationService.getRecommendedReels(profile, 10),
      RecommendationService.getRecommendedHashtags(profile, 12)
    ]);

    res.status(200).json({
      success: true,
      data: {
        users,
        posts,
        reels,
        hashtags,
        // Send back profile stats for debugging/UI purposes if needed
        profileStats: {
          affinityTagsCount: profile.affinityTags.length,
          affinityCreatorsCount: profile.affinityCreators.length
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPersonalizedRecommendations
};
