const Post = require('../models/Post');
const User = require('../models/User');

// Mock Data Generator for Development purposes
const seedMockDataIfNeeded = async () => {
  const count = await Post.countDocuments();
  if (count > 0) return; // Already seeded

  console.log('[DEV ONLY] Seeding database with mock posts for testing Feed UI...');
  
  // Create a mock user if none exists
  let mockUser = await User.findOne({ username: 'snapgram_official' });
  if (!mockUser) {
    mockUser = await User.create({
      fullName: 'SnapGram Official',
      username: 'snapgram_official',
      email: 'hello@snapgram.ai',
      password: 'password123',
      profilePicture: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=200&auto=format&fit=crop',
      isVerified: true
    });
  }

  const mockImages = [
    'https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?q=80&w=1000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1707343843437-caacff5cfa74?q=80&w=1000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1682687220199-d0124f48f95b?q=80&w=1000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1682687982501-1e58f8132c22?q=80&w=1000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1682687221038-404cb8830901?q=80&w=1000&auto=format&fit=crop'
  ];

  for (let i = 0; i < mockImages.length; i++) {
    await Post.create({
      user: mockUser._id,
      media: [{ url: mockImages[i], type: 'image' }],
      caption: `Beautiful moments captured globally 🌍✨ #${i + 1}`,
      likes: [],
      saves: []
    });
  }
};

// @desc    Create a new post
// @route   POST /api/posts
// @access  Private
exports.createPost = async (req, res, next) => {
  try {
    const { 
      caption, 
      mediaData, // Array of {url, type, altText, public_id}
      mediaUrl, // Fallback for old clients
      public_id,
      mediaType = 'image',
      status = 'published',
      scheduledAt,
      location,
      settings
    } = req.body;

    let finalMedia = [];
    if (mediaData && Array.isArray(mediaData) && mediaData.length > 0) {
      finalMedia = mediaData;
    } else if (mediaUrl) {
      finalMedia = [{ url: mediaUrl, public_id, type: mediaType }];
    }

    if (finalMedia.length === 0) {
      return res.status(400).json({ success: false, message: 'Media is required' });
    }

    // Extract hashtags from caption using regex
    const hashtagMatches = caption ? [...caption.matchAll(/#(\w+)/g)].map(m => m[1].toLowerCase()) : [];
    const hashtags = [...new Set(hashtagMatches)]; // deduplicate

    // Extract @mentions from caption
    const mentionMatches = caption ? [...caption.matchAll(/@(\w+)/g)].map(m => m[1].toLowerCase()) : [];
    const uniqueMentions = [...new Set(mentionMatches)];

    // Resolve mentioned usernames to user documents (exclude self)
    let mentionedUsers = [];
    if (uniqueMentions.length > 0) {
      mentionedUsers = await User.find({
        username: { $in: uniqueMentions },
        _id: { $ne: req.user._id }
      }).select('_id username');
    }
    const mentionIds = mentionedUsers.map(u => u._id);

    const newPost = await Post.create({
      user: req.user._id,
      caption,
      media: finalMedia,
      hashtags,
      mentions: mentionIds,
      status,
      scheduledAt,
      location,
      settings
    });

    const populatedPost = await Post.findById(newPost._id).populate('user', 'username fullName avatar profilePicture');

    // Fire mention notifications (non-blocking)
    if (mentionedUsers.length > 0) {
      const Notification = require('../models/Notification');
      const notificationDocs = mentionedUsers.map(u => ({
        recipient: u._id,
        sender: req.user._id,
        type: 'mention',
        post: newPost._id,
        message: `mentioned you in a post`,
      }));
      Notification.insertMany(notificationDocs).catch(err => console.error('[Notification Error]', err));
    }

    res.status(201).json({
      success: true,
      data: populatedPost
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get home feed with pagination
// @route   GET /api/posts/feed
// @access  Private
exports.getFeed = async (req, res, next) => {
  try {
    // Run seeder automatically if DB is completely empty so UI testing works
    await seedMockDataIfNeeded();

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 5;
    const skip = (page - 1) * limit;

    // Fetch current user details to get fresh arrays for blocked, muted, and hidden content
    const currentUser = await User.findById(req.user._id);
    const following = currentUser?.following || [];
    const blockedUsers = (currentUser?.blockedUsers || []).map(id => id.toString());
    const mutedUsers = (currentUser?.mutedUsers || []).map(id => id.toString());
    const hiddenPosts = currentUser?.hiddenPosts || [];

    const excludedUserIds = new Set([...blockedUsers, ...mutedUsers]);
    const feedUserIds = [...following, req.user._id].filter(
      id => id && !excludedUserIds.has(id.toString())
    );

    const filter = {
      $and: [
        { user: { $in: feedUserIds } },
        { status: 'published' },
        { _id: { $nin: hiddenPosts } }
      ]
    };

    // Fetch posts, populate user info
    const posts = await Post.find(filter)
      .sort({ createdAt: -1 }) // Newest first
      .skip(skip)
      .limit(limit)
      .populate('user', 'username fullName avatar profilePicture'); // Only get needed fields

    const total = await Post.countDocuments(filter);
    const hasMore = skip + posts.length < total;

    res.status(200).json({
      success: true,
      data: posts,
      pagination: {
        page,
        limit,
        total,
        hasMore
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle like on a post
// @route   PUT /api/posts/:id/like
// @access  Private
exports.toggleLike = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    // req.user._id will come from the auth middleware (which we will build soon, using mock for now if undefined)
    const userId = req.user ? req.user._id : '660000000000000000000000'; // Fallback if no auth middleware yet

    const isLiked = post.likes.includes(userId);

    if (isLiked) {
      // Unlike
      post.likes = post.likes.filter(id => id.toString() !== userId.toString());
    } else {
      // Like
      post.likes.push(userId);
      
      // Fire notification if not liking own post
      if (post.user.toString() !== userId.toString()) {
        const Notification = require('../models/Notification');
        Notification.create({
          recipient: post.user,
          sender: userId,
          type: 'like',
          post: post._id,
        }).catch(err => console.error('[Notification Error]', err));
      }
    }

    await post.save();

    res.status(200).json({
      success: true,
      data: post.likes,
      isLiked: !isLiked
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get users who liked a post
// @route   GET /api/posts/:id/likes
// @access  Protected
exports.getPostLikes = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('likes', 'username fullName profilePicture avatar category');
    
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    res.status(200).json({
      success: true,
      data: post.likes
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle save on a post
// @route   POST /api/posts/:id/save
// @access  Private
exports.toggleSave = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const userId = req.user ? req.user._id : '660000000000000000000000';
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isSaved = user.savedPosts.includes(post._id);

    if (isSaved) {
      // Unsave
      user.savedPosts = user.savedPosts.filter(id => id.toString() !== post._id.toString());
      post.saves = post.saves.filter(id => id.toString() !== userId.toString());
    } else {
      // Save
      user.savedPosts.push(post._id);
      post.saves.push(userId);
    }

    await Promise.all([user.save(), post.save()]);

    res.status(200).json({
      success: true,
      data: user.savedPosts,
      isSaved: !isSaved
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get explore feed (trending algorithm)
// @route   GET /api/posts/explore
// @access  Private
exports.getExploreFeed = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 15;
    const skip = (page - 1) * limit;

    // Trending algorithm: calculate likes count and sort by it, descending
    const posts = await Post.aggregate([
      { $match: { status: 'published' } },
      {
        $addFields: {
          likesCount: { $size: { $ifNull: ["$likes", []] } }
        }
      },
      { $sort: { likesCount: -1, createdAt: -1 } },
      { $skip: skip },
      { $limit: limit }
    ]);

    // Populate user info since aggregation doesn't do it automatically
    await Post.populate(posts, { 
      path: 'user', 
      select: 'username fullName avatar profilePicture' 
    });

    const total = await Post.countDocuments();
    const hasMore = skip + posts.length < total;

    let responseData = { posts };

    // Only fetch static trending assets on page 1 to optimize performance
    if (page === 1) {
      const [trendingHashtags, newestMedia, suggestedReels] = await Promise.all([
        // 1. Trending hashtags
        Post.aggregate([
          { $match: { hashtags: { $exists: true, $ne: [] } } },
          { $unwind: '$hashtags' },
          { $group: { _id: '$hashtags', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 },
          { $project: { tag: '$_id', count: 1, _id: 0 } }
        ]),
        
        // 2. Newest Media globally
        Post.find({ status: 'published' })
          .sort({ createdAt: -1 })
          .limit(8)
          .populate('user', 'username avatar profilePicture')
          .select('media user likes comments createdAt'),
          
        // 3. Suggested Reels
        Post.aggregate([
          { $match: { status: 'published', 'media.type': 'video' } },
          { $addFields: { likesCount: { $size: { $ifNull: ["$likes", []] } } } },
          { $sort: { likesCount: -1, createdAt: -1 } },
          { $limit: 8 }
        ])
      ]);

      // Populate user info for suggested reels
      await Post.populate(suggestedReels, { 
        path: 'user', 
        select: 'username fullName avatar profilePicture' 
      });

      responseData = {
        posts,
        trendingHashtags,
        newestMedia,
        suggestedReels
      };
    }

    res.status(200).json({
      success: true,
      data: responseData,
      pagination: {
        page,
        limit,
        total,
        hasMore
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get posts by hashtag with pagination, cover, and related tags
// @route   GET /api/posts/hashtag/:tag
// @access  Private
exports.getHashtagPosts = async (req, res, next) => {
  try {
    const tag = req.params.tag.toLowerCase().replace(/^#/, '');
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 15;
    const tab = req.query.tab || 'top'; // 'top' or 'recent'
    const skip = (page - 1) * limit;

    let posts = [];
    
    if (tab === 'top') {
      // Aggregation for top posts (sorted by likes size)
      const pipeline = [
        { $match: { hashtags: tag, status: 'published' } },
        { $addFields: { likesCount: { $size: { $ifNull: ["$likes", []] } } } },
        { $sort: { likesCount: -1, createdAt: -1 } },
        { $skip: skip },
        { $limit: limit }
      ];
      
      posts = await Post.aggregate(pipeline);
      await Post.populate(posts, { path: 'user', select: 'username fullName avatar profilePicture' });
    } else {
      // Standard chronological query for recent
      posts = await Post.find({ hashtags: tag, status: 'published' })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user', 'username fullName avatar profilePicture');
    }

    const total = await Post.countDocuments({ hashtags: tag, status: 'published' });
    const hasMore = skip + posts.length < total;

    let responseData = { posts, pagination: { page, limit, total, hasMore } };

    // Hydrate cover and related tags only on initial load
    if (page === 1) {
      const [relatedData, coverPost] = await Promise.all([
        Post.aggregate([
          { $match: { hashtags: tag } },
          { $unwind: '$hashtags' },
          { $match: { hashtags: { $ne: tag } } },
          { $group: { _id: '$hashtags', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 7 },
          { $project: { tag: '$_id', _id: 0 } }
        ]),
        Post.aggregate([
          { $match: { hashtags: tag, media: { $exists: true, $not: { $size: 0 } } } },
          { $addFields: { likesCount: { $size: { $ifNull: ["$likes", []] } } } },
          { $sort: { likesCount: -1 } },
          { $limit: 1 }
        ])
      ]);

      responseData.relatedHashtags = relatedData.map(r => r.tag);
      responseData.coverMedia = coverPost.length > 0 ? coverPost[0].media[0].url : null;
    }

    res.status(200).json({ success: true, data: responseData });
  } catch (error) {
    next(error);
  }
};

// @desc    Get posts by user ID
// @route   GET /api/posts/user/:userId
// @access  Private
exports.getUserPosts = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 12;
    const skip = (page - 1) * limit;

    // For another user, only show published. For the logged-in user, show based on requested tab (handled via query param if needed)
    const isOwnProfile = req.user && req.user._id.toString() === userId;
    const requestedStatus = req.query.status || 'published';
    
    // Only allow viewing non-published posts if it's the owner
    const statusFilter = (!isOwnProfile && requestedStatus !== 'published') 
      ? 'published' 
      : requestedStatus;

    const query = { user: userId, status: statusFilter };

    const posts = await Post.find(query)
      .sort({ isPinned: -1, createdAt: -1 }) // Pinned first, then newest
      .skip(skip)
      .limit(limit)
      .populate('user', 'username avatar profilePicture');

    const total = await Post.countDocuments(query);
    const hasMore = skip + posts.length < total;

    res.status(200).json({
      success: true,
      data: {
        posts,
        pagination: { page, limit, total, hasMore }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get trending hashtags by post count, with growth & search volume
// @route   GET /api/posts/trending-hashtags
// @access  Private
exports.getTrendingHashtags = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 20;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const trending = await Post.aggregate([
      { $match: { hashtags: { $exists: true, $ne: [] } } },
      { $unwind: '$hashtags' },
      { 
        $group: { 
          _id: '$hashtags', 
          count: { $sum: 1 },
          likesSum: { $sum: { $size: { $ifNull: ["$likes", []] } } },
          commentsSum: { $sum: { $size: { $ifNull: ["$comments", []] } } },
          currentWeekCount: {
            $sum: { $cond: [{ $gte: ["$createdAt", sevenDaysAgo] }, 1, 0] }
          },
          previousWeekCount: {
            $sum: { 
              $cond: [
                { $and: [{ $gte: ["$createdAt", fourteenDaysAgo] }, { $lt: ["$createdAt", sevenDaysAgo] }] }, 
                1, 
                0
              ] 
            }
          }
        } 
      },
      { 
        $addFields: {
          searchVolume: { $add: [{ $multiply: ["$count", 15] }, { $multiply: ["$likesSum", 3] }, "$commentsSum"] },
          growth: {
            $cond: [
              { $eq: ["$previousWeekCount", 0] },
              { $cond: [{ $gt: ["$currentWeekCount", 0] }, 100, 0] }, // If previous was 0, but current > 0 = 100% growth
              { 
                $multiply: [
                  { $divide: [ { $subtract: ["$currentWeekCount", "$previousWeekCount"] }, "$previousWeekCount" ] },
                  100
                ] 
              }
            ]
          }
        }
      },
      { $sort: { count: -1 } },
      { $limit: limit },
      { $project: { tag: '$_id', count: 1, searchVolume: 1, growth: 1, _id: 0 } }
    ]);

    // Format growth to remove long decimals
    const formattedTrending = trending.map(t => ({
      ...t,
      growth: Math.round(t.growth)
    }));

    res.status(200).json({ success: true, data: formattedTrending });
  } catch (error) {
    next(error);
  }
};

// @desc    Edit a post
// @route   PUT /api/posts/:id
// @access  Private
exports.editPost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }
    if (post.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this post' });
    }

    const { caption, location, mediaData } = req.body;
    
    if (caption !== undefined) post.caption = caption;
    if (location !== undefined) post.location = location;
    
    // Update altText in media
    if (mediaData && Array.isArray(mediaData)) {
      post.media = post.media.map((m, i) => {
        if (mediaData[i] && mediaData[i].altText !== undefined) {
          m.altText = mediaData[i].altText;
        }
        return m;
      });
    }

    // Re-extract hashtags
    if (caption !== undefined) {
      const hashtagMatches = [...caption.matchAll(/#(\w+)/g)].map(m => m[1].toLowerCase());
      post.hashtags = [...new Set(hashtagMatches)];
      
      const mentionMatches = [...caption.matchAll(/@(\w+)/g)].map(m => m[1].toLowerCase());
      const uniqueMentions = [...new Set(mentionMatches)];
      if (uniqueMentions.length > 0) {
        const mentionedUsers = await User.find({
          username: { $in: uniqueMentions },
          _id: { $ne: req.user._id }
        }).select('_id');
        post.mentions = mentionedUsers.map(u => u._id);
      } else {
        post.mentions = [];
      }
    }

    await post.save();
    
    const populatedPost = await Post.findById(post._id).populate('user', 'username fullName avatar profilePicture');
    res.status(200).json({ success: true, data: populatedPost });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a post
// @route   DELETE /api/posts/:id
// @access  Private
exports.deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }
    if (post.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this post' });
    }

    const Comment = require('../models/Comment');
    await Promise.all([
      Post.findByIdAndDelete(req.params.id),
      Comment.deleteMany({ post: req.params.id }),
      User.updateMany({ savedPosts: req.params.id }, { $pull: { savedPosts: req.params.id } })
    ]);

    const { getIo } = require('../socket');
    const io = getIo();
    if (io) {
      io.emit('postDeleted', { postId: req.params.id });
    }

    res.status(200).json({ success: true, message: 'Post deleted' });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a post (Caption, Location, Alt-Text, Settings)
// @route   PUT /api/posts/:id
// @access  Private
exports.updatePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    if (post.user.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: 'Not authorized' });

    const { caption, location, altText, settings } = req.body;
    if (caption !== undefined) post.caption = caption;
    if (location !== undefined) post.location = location;
    if (altText !== undefined && post.media?.[0]) post.media[0].altText = altText;
    if (settings !== undefined) post.settings = { ...post.settings, ...settings };

    await post.save();
    const updated = await Post.findById(post._id).populate('user', 'username fullName avatar profilePicture');
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

// @desc    Archive/Unarchive a post
// @route   PUT /api/posts/:id/archive
// @access  Private
exports.archivePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    if (post.user.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: 'Not authorized' });

    post.status = post.status === 'archived' ? 'published' : 'archived';
    await post.save();

    res.status(200).json({ success: true, data: post });
  } catch (error) {
    next(error);
  }
};

// @desc    Pin/Unpin a post
// @route   PUT /api/posts/:id/pin
// @access  Private
exports.pinPost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    if (post.user.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: 'Not authorized' });

    post.isPinned = !post.isPinned;
    await post.save();

    res.status(200).json({ success: true, data: post });
  } catch (error) {
    next(error);
  }
};

// @desc    Update post settings
// @route   PUT /api/posts/:id/settings
// @access  Private
exports.updatePostSettings = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    if (post.user.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: 'Not authorized' });

    const { commentsEnabled, hideLikes, sharingEnabled } = req.body;
    
    if (!post.settings) post.settings = {};
    if (commentsEnabled !== undefined) post.settings.commentsEnabled = commentsEnabled;
    if (hideLikes !== undefined) post.settings.hideLikes = hideLikes;
    if (sharingEnabled !== undefined) post.settings.sharingEnabled = sharingEnabled;
    
    await post.save();
    res.status(200).json({ success: true, data: post });
  } catch (error) {
    next(error);
  }
};

// @desc    Report a post
// @route   POST /api/posts/:id/report
// @access  Private
exports.reportPost = async (req, res, next) => {
  try {
    const { reason, details } = req.body;
    if (!reason) return res.status(400).json({ success: false, message: 'Reason is required' });

    const Report = require('../models/Report');
    const newReport = await Report.create({
      reporter: req.user._id,
      post: req.params.id,
      reason,
      details
    });

    res.status(201).json({ success: true, data: newReport, message: 'Report submitted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Hide a post from feed
// @route   POST /api/posts/:id/hide
// @access  Private
exports.hidePost = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user.hiddenPosts.includes(req.params.id)) {
      user.hiddenPosts.push(req.params.id);
      await user.save();
    }
    
    res.status(200).json({ success: true, message: 'Post hidden from feed' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single post by ID
// @route   GET /api/posts/:id
// @access  Private
exports.getPostById = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('user', 'username fullName profilePicture avatar isVerified bio followers')
      .lean();

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const currentUserId = req.user._id.toString();
    const isLiked = post.likes?.some(id => id.toString() === currentUserId);
    const isSaved = post.saves?.some(id => id.toString() === currentUserId);

    res.status(200).json({
      success: true,
      data: {
        ...post,
        isLiked: Boolean(isLiked),
        isSaved: Boolean(isSaved),
        likesCount: post.likes ? post.likes.length : 0,
        savesCount: post.saves ? post.saves.length : 0
      }
    });
  } catch (error) {
    next(error);
  }
};


