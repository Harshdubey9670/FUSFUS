const User = require('../models/User');
const Post = require('../models/Post');
const Story = require('../models/Story');

const escapeRegex = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
};

// @desc    Global search (Users and Hashtags)
// @route   GET /api/search
// @access  Private
const globalSearch = async (req, res, next) => {
  try {
    const q = req.query.q || '';
    if (!q) {
      return res.status(200).json({ success: true, data: { users: [], hashtags: [] } });
    }

    const escapedQ = escapeRegex(q);

    const [users, hashtags] = await Promise.all([
      // Search users
      User.find({
        $or: [
          { username: { $regex: escapedQ, $options: 'i' } },
          { fullName: { $regex: escapedQ, $options: 'i' } }
        ]
      })
      .select('username fullName profilePicture avatar')
      .limit(10),

      // Search hashtags
      Post.aggregate([
        { $match: { hashtags: { $regex: escapedQ, $options: 'i' } } },
        { $unwind: '$hashtags' },
        { $match: { hashtags: { $regex: escapedQ, $options: 'i' } } }, // re-match after unwind
        { $group: { _id: '$hashtags', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        { $project: { tag: '$_id', count: 1, _id: 0 } }
      ])
    ]);

    res.status(200).json({ 
      success: true, 
      data: { users, hashtags } 
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get popular users and trending tags for empty state
// @route   GET /api/search/suggestions
// @access  Private
const getSearchSuggestions = async (req, res, next) => {
  try {
    const [popularUsers, trendingTags] = await Promise.all([
      User.aggregate([
        { $addFields: { followersCount: { $size: { $ifNull: ["$followers", []] } } } },
        { $sort: { followersCount: -1, createdAt: 1 } },
        { $limit: 5 },
        { $project: { username: 1, fullName: 1, avatar: 1, profilePicture: 1 } }
      ]),
      Post.aggregate([
        { $match: { hashtags: { $exists: true, $ne: [] } } },
        { $unwind: '$hashtags' },
        { $group: { _id: '$hashtags', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
        { $project: { tag: '$_id', count: 1, _id: 0 } }
      ])
    ]);

    res.status(200).json({
      success: true,
      data: {
        popularUsers,
        trendingTags
      }
    });
  } catch (error) {
    next(error);
  }
};

// Legacy support if anything still calls /api/search/users
const searchUsers = async (req, res, next) => {
  try {
    const q = req.query.q || '';
    if (!q) return res.status(200).json({ success: true, data: [] });

    const escapedQ = escapeRegex(q);

    const users = await User.find({
      $or: [
        { username: { $regex: escapedQ, $options: 'i' } },
        { fullName: { $regex: escapedQ, $options: 'i' } }
      ]
    }).select('username fullName profilePicture avatar').limit(20);

    res.status(200).json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

// @desc    Advanced search for a dedicated results page
// @route   GET /api/search/advanced
// @access  Private
const advancedSearch = async (req, res, next) => {
  try {
    const q = req.query.q || '';
    const type = req.query.type || 'all'; // 'all', 'users', 'posts'
    const location = req.query.location || '';
    const date = req.query.date || 'all'; // 'today', 'week', 'month', 'year', 'all'
    const mediaType = req.query.mediaType || 'all'; // 'image', 'video', 'all'
    const verified = req.query.verified === 'true';
    const sort = req.query.sort || 'recent'; // 'recent', 'popular'
    
    // Security/Abuse limits: cap page depth to 100, and max limit to 50
    const page = Math.min(parseInt(req.query.page, 10) || 1, 100);
    const limit = Math.min(parseInt(req.query.limit, 10) || 15, 50);
    const skip = (page - 1) * limit;

    let users = [];
    let posts = [];
    let stories = [];
    let hashtags = [];
    let userHasMore = false;
    let postHasMore = false;
    let storyHasMore = false;
    
    const escapedQ = escapeRegex(q);

    // --- User Search ---
    if (type === 'all' || type === 'users') {
      let userQuery = {};
      if (q) {
        userQuery.$or = [
          { username: { $regex: escapedQ, $options: 'i' } },
          { fullName: { $regex: escapedQ, $options: 'i' } }
        ];
      }
      if (verified) userQuery.isVerified = true;

      // Note: we can't sort users easily by "popularity" with a simple find unless we aggregate followersCount
      // For simplicity, if sort=popular, we'll just sort by createdAt for now, or aggregate if needed.
      // We will do a simple find to keep it fast, but we can aggregate if needed.
      if (sort === 'popular') {
        const userAgg = await User.aggregate([
          { $match: userQuery },
          { $addFields: { followersCount: { $size: { $ifNull: ["$followers", []] } } } },
          { $sort: { followersCount: -1 } },
          { $skip: skip },
          { $limit: limit + 1 },
          { $project: { username: 1, fullName: 1, profilePicture: 1, avatar: 1, isVerified: 1, followersCount: 1 } }
        ]);
        userHasMore = userAgg.length > limit;
        users = userHasMore ? userAgg.slice(0, limit) : userAgg;
      } else {
        const userRes = await User.find(userQuery)
          .select('username fullName profilePicture avatar isVerified')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit + 1);
        userHasMore = userRes.length > limit;
        users = userHasMore ? userRes.slice(0, limit) : userRes;
      }
    }

    // --- Post Search ---
    if (['all', 'posts', 'reels', 'locations', 'audio', 'hashtags'].includes(type)) {
      let postQuery = {};
      
      if (q) {
        if (type === 'reels' || type === 'posts' || type === 'all') {
          postQuery.$or = [
            { caption: { $regex: escapedQ, $options: 'i' } },
            { hashtags: { $regex: escapedQ, $options: 'i' } },
            { location: { $regex: escapedQ, $options: 'i' } },
            { audio: { $regex: escapedQ, $options: 'i' } }
          ];
        } else if (type === 'locations') {
          postQuery.location = { $regex: escapedQ, $options: 'i' };
        } else if (type === 'audio') {
          postQuery.audio = { $regex: escapedQ, $options: 'i' };
        } else if (type === 'hashtags') {
          postQuery.hashtags = { $regex: escapedQ, $options: 'i' };
        }
      }

      if (type === 'reels') {
        postQuery['media.type'] = 'video';
      }

      if (location) {
        postQuery.location = { $regex: escapeRegex(location), $options: 'i' };
      }

      if (mediaType !== 'all') {
        postQuery['media.type'] = mediaType;
      }

      if (date !== 'all') {
        const now = new Date();
        if (date === 'today') now.setHours(0,0,0,0);
        else if (date === 'week') now.setDate(now.getDate() - 7);
        else if (date === 'month') now.setMonth(now.getMonth() - 1);
        else if (date === 'year') now.setFullYear(now.getFullYear() - 1);
        
        if (date !== 'all') {
          postQuery.createdAt = { $gte: now };
        }
      }

      // If verified filter is on, we need to find posts by verified users. 
      if (verified) {
        const verifiedUsers = await User.find({ isVerified: true }).select('_id');
        postQuery.user = { $in: verifiedUsers.map(u => u._id) };
      }

      const sortQuery = sort === 'popular' ? { commentsCount: -1, createdAt: -1 } : { createdAt: -1 };

      const postRes = await Post.find(postQuery)
        .sort(sortQuery) 
        .skip(skip)
        .limit(limit + 1)
        .populate('user', 'username fullName profilePicture avatar isVerified');

      postHasMore = postRes.length > limit;
      posts = postHasMore ? postRes.slice(0, limit) : postRes;
    }

    // --- Story Search ---
    if (type === 'all' || type === 'stories') {
      // Find users matching query
      let storyUserQuery = {};
      if (q) {
        storyUserQuery.$or = [
          { username: { $regex: escapedQ, $options: 'i' } },
          { fullName: { $regex: escapedQ, $options: 'i' } }
        ];
      }
      if (verified) storyUserQuery.isVerified = true;

      const matchedUsers = await User.find(storyUserQuery).select('_id');
      
      const storyRes = await Story.find({
        user: { $in: matchedUsers.map(u => u._id) },
        expiresAt: { $gt: new Date() }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit + 1)
      .populate('user', 'username fullName profilePicture avatar isVerified');

      storyHasMore = storyRes.length > limit;
      stories = storyHasMore ? storyRes.slice(0, limit) : storyRes;
    }

    // --- Hashtags Aggregation (only if type=hashtags or all) ---
    if (type === 'all' || type === 'hashtags') {
      if (q) {
        const hashtagAgg = await Post.aggregate([
          { $match: { hashtags: { $regex: escapedQ, $options: 'i' } } },
          { $unwind: '$hashtags' },
          { $match: { hashtags: { $regex: escapedQ, $options: 'i' } } },
          { $group: { _id: '$hashtags', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $skip: skip },
          { $limit: limit },
          { $project: { tag: '$_id', count: 1, _id: 0 } }
        ]);
        hashtags = hashtagAgg;
      }
    }

    res.status(200).json({
      success: true,
      data: {
        users,
        posts,
        stories,
        hashtags,
        pagination: {
          page,
          userHasMore,
          postHasMore,
          storyHasMore
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// --- Saved Searches & History ---

// @desc    Get user's search history
// @route   GET /api/search/history
// @access  Private
const getSearchHistory = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    // Sort logic: pinned first, then by timestamp descending
    const history = user.searchHistory.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return b.timestamp - a.timestamp;
    });
    res.status(200).json({ success: true, data: history });
  } catch (error) {
    next(error);
  }
};

// @desc    Add a search to history
// @route   POST /api/search/history
// @access  Private
const addSearchHistory = async (req, res, next) => {
  try {
    const { query, type, refId, username, fullName, avatar, tag } = req.body;
    
    if (!query) {
      return res.status(400).json({ success: false, message: 'Query is required' });
    }

    const user = await User.findById(req.user.id);
    let history = user.searchHistory;

    // Check if it already exists (by query or refId) to avoid duplicates
    const existingIndex = history.findIndex(h => 
      (refId && h.refId && h.refId.toString() === refId) || 
      (h.query === query && h.type === type)
    );

    if (existingIndex > -1) {
      // Update timestamp if it's not pinned, so it jumps to top of unpinned
      history[existingIndex].timestamp = Date.now();
      // If we provided new cached data, update it
      if (avatar) history[existingIndex].avatar = avatar;
    } else {
      // Add new
      history.push({
        query, type: type || 'text', refId, username, fullName, avatar, tag, timestamp: Date.now()
      });
    }

    // Keep limit to max 20 unpinned items (plus however many pinned)
    const pinned = history.filter(h => h.isPinned);
    const unpinned = history.filter(h => !h.isPinned).sort((a, b) => b.timestamp - a.timestamp).slice(0, 20);
    
    user.searchHistory = [...pinned, ...unpinned];
    await user.save();

    res.status(200).json({ success: true, data: user.searchHistory });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle pin on search history
// @route   PUT /api/search/history/:id/pin
// @access  Private
const toggleSearchPin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const item = user.searchHistory.id(req.params.id);
    
    if (!item) {
      return res.status(404).json({ success: false, message: 'Search history item not found' });
    }

    item.isPinned = !item.isPinned;
    await user.save();

    res.status(200).json({ success: true, data: user.searchHistory });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a specific search history item
// @route   DELETE /api/search/history/:id
// @access  Private
const deleteSearchHistory = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    user.searchHistory = user.searchHistory.filter(h => h._id.toString() !== req.params.id);
    await user.save();
    res.status(200).json({ success: true, data: user.searchHistory });
  } catch (error) {
    next(error);
  }
};

// @desc    Clear all unpinned search history
// @route   DELETE /api/search/history
// @access  Private
const clearSearchHistory = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    user.searchHistory = user.searchHistory.filter(h => h.isPinned);
    await user.save();
    res.status(200).json({ success: true, data: user.searchHistory });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  globalSearch,
  getSearchSuggestions,
  searchUsers,
  advancedSearch,
  getSearchHistory,
  addSearchHistory,
  toggleSearchPin,
  deleteSearchHistory,
  clearSearchHistory
};
