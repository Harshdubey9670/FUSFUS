const mongoose = require('mongoose');
const User = require('../models/User');
const Post = require('../models/Post');

class RecommendationService {
  /**
   * Generates an "Affinity Profile" for a given user.
   * Scans their recent likes, saves, and follows to extract 
   * their preferred hashtags and creators.
   */
  async buildAffinityProfile(userId) {
    const user = await User.findById(userId).populate('savedPosts');
    if (!user) throw new Error('User not found');

    const followingIds = user.following || [];
    const savedPostIds = user.savedPosts?.map(p => p._id) || [];

    // Find posts the user has recently liked or commented on (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const interactedPosts = await Post.find({
      $or: [
        { likes: userId },
        { 'comments.user': userId },
        { _id: { $in: savedPostIds } }
      ],
      createdAt: { $gte: thirtyDaysAgo }
    }).limit(100).select('hashtags user');

    // Aggregate hashtags to find favorites
    const tagFreq = {};
    const creatorFreq = {};

    interactedPosts.forEach(post => {
      // Score hashtags
      post.hashtags?.forEach(tag => {
        tagFreq[tag] = (tagFreq[tag] || 0) + 1;
      });
      // Score creators
      const creatorIdStr = post.user.toString();
      if (creatorIdStr !== userId.toString()) {
        creatorFreq[creatorIdStr] = (creatorFreq[creatorIdStr] || 0) + 1;
      }
    });

    const topHashtags = Object.entries(tagFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(entry => entry[0]);

    const topCreators = Object.entries(creatorFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(entry => new mongoose.Types.ObjectId(entry[0]));

    return {
      userId,
      followingIds,
      affinityTags: topHashtags,
      affinityCreators: topCreators
    };
  }

  /**
   * Recommend Users:
   * 1. Users followed by Affinity Creators
   * 2. Popular users in Affinity Tags
   */
  async getRecommendedUsers(profile, limit = 10) {
    const { userId, followingIds, affinityTags, affinityCreators } = profile;
    const excludeIds = [...followingIds, userId];

    const recommendedUsers = await User.aggregate([
      { $match: { _id: { $nin: excludeIds } } },
      
      // Look up their posts to see if they use the affinity tags
      {
        $lookup: {
          from: 'posts',
          let: { uId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$user', '$$uId'] } } },
            { $limit: 10 }
          ],
          as: 'recentPosts'
        }
      },
      
      // Calculate a score based on followers and tag overlap
      {
        $addFields: {
          followerScore: { $size: { $ifNull: ["$followers", []] } },
          tagOverlapScore: {
            $size: {
              $setIntersection: [
                affinityTags,
                { $reduce: { input: "$recentPosts.hashtags", initialValue: [], in: { $setUnion: ["$$value", "$$this"] } } }
              ]
            }
          }
        }
      },
      
      {
        $addFields: {
          recommendationScore: { $add: ["$followerScore", { $multiply: ["$tagOverlapScore", 50] }] }
        }
      },
      
      { $sort: { recommendationScore: -1 } },
      { $limit: limit },
      { $project: { password: 0, recentPosts: 0, email: 0, otp: 0, otpExpires: 0 } }
    ]);

    return recommendedUsers;
  }

  /**
   * Recommend Posts:
   * Contains affinity tags, not from users already followed.
   */
  async getRecommendedPosts(profile, limit = 15) {
    const { userId, followingIds, affinityTags } = profile;
    const excludeIds = [...followingIds, userId];

    let matchCriteria = { user: { $nin: excludeIds } };
    
    // If we have affinity tags, prioritize them
    if (affinityTags.length > 0) {
      matchCriteria.hashtags = { $in: affinityTags };
    }

    const posts = await Post.find(matchCriteria)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('user', 'username fullName avatar profilePicture isVerified');

    return posts;
  }

  /**
   * Recommend Reels:
   * Similar to posts, but filtered by video media type.
   */
  async getRecommendedReels(profile, limit = 10) {
    const { userId, followingIds, affinityTags } = profile;
    const excludeIds = [...followingIds, userId];

    let matchCriteria = { 
      user: { $nin: excludeIds },
      'media.type': 'video' 
    };
    
    if (affinityTags.length > 0) {
      matchCriteria.hashtags = { $in: affinityTags };
    }

    const reels = await Post.find(matchCriteria)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('user', 'username fullName avatar profilePicture isVerified');

    return reels;
  }

  /**
   * Recommend Hashtags:
   * Returns top affinity tags, mixed with globally trending ones.
   */
  async getRecommendedHashtags(profile, limit = 10) {
    const { affinityTags } = profile;

    // Get globally trending tags
    const trending = await Post.aggregate([
      { $match: { hashtags: { $exists: true, $ne: [] } } },
      { $unwind: '$hashtags' },
      { $group: { _id: '$hashtags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: limit }
    ]);

    const globalTags = trending.map(t => t._id);
    
    // Merge and deduplicate
    const combined = [...new Set([...affinityTags, ...globalTags])].slice(0, limit);
    return combined;
  }
}

module.exports = new RecommendationService();
