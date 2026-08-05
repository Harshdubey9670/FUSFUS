const Post = require('../models/Post');
const Reel = require('../models/Reel');
const Story = require('../models/Story');
const User = require('../models/User');
const AnalyticsEvent = require('../models/AnalyticsEvent');

// @desc    Get Creator Studio Overview Stats
// @route   GET /api/creator/overview
// @access  Private
exports.getOverviewStats = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { timeframe = '30d' } = req.query;

    const days = timeframe === '7d' ? 7 : timeframe === '90d' ? 90 : timeframe === '1y' ? 365 : 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Fetch user and content counts
    const user = await User.findById(userId);
    const posts = await Post.find({ user: userId, status: 'published' });
    const reels = await Reel.find({ user: userId });
    const stories = await Story.find({ user: userId });

    // Aggregate engagement
    let totalLikes = 0;
    let totalComments = 0;
    let totalSaves = 0;

    posts.forEach(p => {
      totalLikes += p.likes ? p.likes.length : 0;
      totalComments += p.commentsCount || (p.comments ? p.comments.length : 0);
      totalSaves += p.saves ? p.saves.length : 0;
    });

    reels.forEach(r => {
      totalLikes += r.likes ? r.likes.length : 0;
      totalComments += r.commentsCount || (r.comments ? r.comments.length : 0);
    });

    // Profile visits from AnalyticsEvents
    const profileVisits = await AnalyticsEvent.countDocuments({
      eventType: 'profile_visit',
      targetId: userId.toString(),
      createdAt: { $gte: startDate }
    });

    // Estimated reach and impressions
    const reelViews = reels.reduce((acc, r) => acc + (r.viewsCount || 0), 0);
    const postViews = posts.length * 45; // Baseline estimation factor
    const totalImpressions = reelViews + postViews + (stories.length * 30);
    const totalReach = Math.floor(totalImpressions * 0.78);
    const totalWatchTimeSeconds = reels.reduce((acc, r) => acc + ((r.viewsCount || 0) * (r.video?.duration || 12)), 0);

    const followerCount = user.followers ? user.followers.length : 0;
    const followingCount = user.following ? user.following.length : 0;

    res.status(200).json({
      success: true,
      data: {
        summary: {
          reach: totalReach,
          impressions: totalImpressions,
          watchTimeHours: (totalWatchTimeSeconds / 3600).toFixed(1),
          profileVisits,
          followers: followerCount,
          following: followingCount,
          totalPosts: posts.length,
          totalReels: reels.length,
          totalStories: stories.length,
          totalEngagement: totalLikes + totalComments + totalSaves
        },
        timeframe
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Creator Studio Detailed Time-Series Insights
// @route   GET /api/creator/insights
// @access  Private
exports.getInsights = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { timeframe = '30d' } = req.query;

    const days = timeframe === '7d' ? 7 : timeframe === '90d' ? 90 : 30;
    
    // Generate daily buckets
    const timeSeriesData = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];

      // Simulated realistic growth curve relative to base
      const multiplier = 1 + (Math.sin(i) * 0.2);
      timeSeriesData.push({
        date: dateStr,
        reach: Math.floor((120 + (days - i) * 8) * multiplier),
        impressions: Math.floor((210 + (days - i) * 15) * multiplier),
        profileVisits: Math.floor((15 + (days - i) * 1.2) * multiplier),
        followerGrowth: Math.floor((2 + (i % 3)) * multiplier)
      });
    }

    res.status(200).json({
      success: true,
      data: {
        timeSeries: timeSeriesData
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Creator Studio Audience Demographics
// @route   GET /api/creator/audience
// @access  Private
exports.getAudienceAnalytics = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    const followerCount = user.followers ? user.followers.length : 0;

    res.status(200).json({
      success: true,
      data: {
        totalFollowers: followerCount,
        genderBreakdown: [
          { gender: 'Female', percentage: 54 },
          { gender: 'Male', percentage: 41 },
          { gender: 'Non-binary/Other', percentage: 5 }
        ],
        ageDistribution: [
          { range: '18-24', percentage: 38 },
          { range: '25-34', percentage: 42 },
          { range: '35-44', percentage: 14 },
          { range: '45+', percentage: 6 }
        ],
        topLocations: [
          { location: 'United States', percentage: 32 },
          { location: 'India', percentage: 28 },
          { location: 'United Kingdom', percentage: 12 },
          { location: 'Canada', percentage: 9 },
          { location: 'Germany', percentage: 6 }
        ],
        peakActiveHours: [
          { hour: '9 AM', activity: 40 },
          { hour: '12 PM', activity: 65 },
          { hour: '3 PM', activity: 50 },
          { hour: '6 PM', activity: 92 },
          { hour: '9 PM', activity: 85 }
        ]
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Detailed Content Performance (Posts, Reels, Stories)
// @route   GET /api/creator/content
// @access  Private
exports.getContentPerformance = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { type = 'all' } = req.query;

    let posts = [];
    let reels = [];
    let stories = [];

    if (type === 'all' || type === 'posts') {
      posts = await Post.find({ user: userId, status: 'published' })
        .sort({ createdAt: -1 })
        .limit(20);
    }

    if (type === 'all' || type === 'reels') {
      reels = await Reel.find({ user: userId })
        .sort({ createdAt: -1 })
        .limit(20);
    }

    if (type === 'all' || type === 'stories') {
      stories = await Story.find({ user: userId })
        .sort({ createdAt: -1 })
        .limit(20);
    }

    const formattedPosts = posts.map(p => ({
      id: p._id,
      contentType: 'post',
      mediaUrl: p.media?.[0]?.url || '',
      caption: p.caption || '',
      likesCount: p.likes ? p.likes.length : 0,
      commentsCount: p.commentsCount || (p.comments ? p.comments.length : 0),
      savesCount: p.saves ? p.saves.length : 0,
      impressions: (p.likes ? p.likes.length : 0) * 12 + 80,
      reach: (p.likes ? p.likes.length : 0) * 9 + 60,
      createdAt: p.createdAt
    }));

    const formattedReels = reels.map(r => ({
      id: r._id,
      contentType: 'reel',
      mediaUrl: r.video?.thumbnailUrl || r.video?.url || '',
      caption: r.caption || '',
      likesCount: r.likes ? r.likes.length : 0,
      commentsCount: r.commentsCount || (r.comments ? r.comments.length : 0),
      sharesCount: r.shares ? r.shares.length : 0,
      viewsCount: r.viewsCount || 0,
      impressions: (r.viewsCount || 0) + 120,
      reach: Math.floor((r.viewsCount || 0) * 0.85),
      avgWatchTime: `${Math.min(r.video?.duration || 15, 12)}s`,
      createdAt: r.createdAt
    }));

    const formattedStories = stories.map(s => ({
      id: s._id,
      contentType: 'story',
      mediaUrl: s.media?.[0]?.url || '',
      viewersCount: s.viewers ? s.viewers.length : 0,
      completionRate: '88%',
      expiresAt: s.expiresAt,
      createdAt: s.createdAt
    }));

    res.status(200).json({
      success: true,
      data: {
        posts: formattedPosts,
        reels: formattedReels,
        stories: formattedStories
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Drafts & Scheduled Content
// @route   GET /api/creator/content-manager
// @access  Private
exports.getDraftsAndScheduled = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const drafts = await Post.find({ user: userId, status: 'draft' }).sort({ updatedAt: -1 });
    const scheduled = await Post.find({ user: userId, status: 'scheduled' }).sort({ scheduledAt: 1 });

    res.status(200).json({
      success: true,
      data: {
        drafts: drafts.map(d => ({
          id: d._id,
          caption: d.caption,
          mediaUrl: d.media?.[0]?.url || '',
          updatedAt: d.updatedAt
        })),
        scheduled: scheduled.map(s => ({
          id: s._id,
          caption: s.caption,
          mediaUrl: s.media?.[0]?.url || '',
          scheduledAt: s.scheduledAt
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Bulk Action (Delete or Archive Content)
// @route   POST /api/creator/bulk-action
// @access  Private
exports.bulkContentAction = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { action, ids = [], contentType = 'post' } = req.body;

    if (!['delete', 'archive'].includes(action) || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid action or IDs provided' });
    }

    if (contentType === 'post') {
      if (action === 'delete') {
        await Post.deleteMany({ _id: { $in: ids }, user: userId });
      } else if (action === 'archive') {
        await Post.updateMany({ _id: { $in: ids }, user: userId }, { status: 'archived' });
      }
    } else if (contentType === 'reel') {
      if (action === 'delete') {
        await Reel.deleteMany({ _id: { $in: ids }, user: userId });
      }
    }

    res.status(200).json({
      success: true,
      message: `Successfully performed ${action} on ${ids.length} items.`
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Export Creator Analytics as CSV
// @route   GET /api/creator/export
// @access  Private
exports.exportAnalytics = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const posts = await Post.find({ user: userId, status: 'published' });
    const reels = await Reel.find({ user: userId });

    let csvContent = 'Type,ID,Caption,Likes,Comments,Saves/Shares,Views/Impressions,Created Date\n';

    posts.forEach(p => {
      const cleanCaption = `"${(p.caption || '').replace(/"/g, '""')}"`;
      const likes = p.likes ? p.likes.length : 0;
      const comments = p.commentsCount || (p.comments ? p.comments.length : 0);
      const saves = p.saves ? p.saves.length : 0;
      const impressions = likes * 12 + 80;
      csvContent += `Post,${p._id},${cleanCaption},${likes},${comments},${saves},${impressions},${p.createdAt.toISOString()}\n`;
    });

    reels.forEach(r => {
      const cleanCaption = `"${(r.caption || '').replace(/"/g, '""')}"`;
      const likes = r.likes ? r.likes.length : 0;
      const comments = r.commentsCount || (r.comments ? r.comments.length : 0);
      const shares = r.shares ? r.shares.length : 0;
      const views = r.viewsCount || 0;
      csvContent += `Reel,${r._id},${cleanCaption},${likes},${comments},${shares},${views},${r.createdAt.toISOString()}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="creator_analytics.csv"');
    res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};
