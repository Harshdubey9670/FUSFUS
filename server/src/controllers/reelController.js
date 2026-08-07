const Reel = require('../models/Reel');
const Comment = require('../models/Comment');

// Helper — extract hashtags from a caption string
const extractHashtags = (text) =>
  (text.match(/#\w+/g) || []).map((tag) => tag.slice(1).toLowerCase());

// Helper — extract @mentions from a caption string
const extractMentions = (text) =>
  (text.match(/@\w+/g) || []).map((m) => m.slice(1).toLowerCase());

// Seed mock reels with real Cloudinary-compatible stock videos
const seedMockReelsIfNeeded = async () => {
  const count = await Reel.countDocuments();
  if (count > 0) return;

  console.log('[DEV ONLY] Seeding mock reels...');
  const User = require('../models/User');
  let mockUser = await User.findOne({ username: 'snapgram_official' });
  if (!mockUser) return;

  const mockVideos = [
    {
      url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      caption: 'Golden hour vibes ✨ #sunset #vibes #aesthetic',
      music: { title: 'Golden Hour', artist: 'JVKE' },
    },
    {
      url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      caption: 'Nature is healing 🌿 #nature #peaceful #relaxing',
      music: { title: 'Forest Sound', artist: 'Ambient' },
    },
    {
      url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      caption: 'City nights never sleep 🌃 #citylife #urban #nighttime',
      music: { title: 'Midnight City', artist: 'M83' },
    },
    {
      url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
      caption: 'Ocean therapy 🌊 #ocean #waves #travel',
      music: { title: 'Ocean Eyes', artist: 'Billie Eilish' },
    },
    {
      url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
      caption: 'Coffee culture ☕ #coffee #morning #lifestyle',
      music: { title: 'Good Day', artist: 'Surfaces' },
    },
  ];

  for (const mock of mockVideos) {
    await Reel.create({
      user: mockUser._id,
      caption: mock.caption,
      video: { url: mock.url },
      music: mock.music,
      hashtags: extractHashtags(mock.caption),
    });
  }
};

// @desc    Get video reel feed (paginated)
// @route   GET /api/reels
// @access  Private
exports.getReels = async (req, res, next) => {
  try {
    await seedMockReelsIfNeeded();

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const reels = await Reel.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'username fullName profilePicture')
      .lean();

    const total = await Reel.countDocuments();

    res.status(200).json({
      success: true,
      data: reels,
      pagination: { page, limit, total, hasMore: skip + reels.length < total },
    });
  } catch (error) {
    next(error);
  }
};


// @desc    Create a new reel
// @route   POST /api/reels
// @access  Private
exports.createReel = async (req, res, next) => {
  try {
    const { 
      caption = '', 
      video, 
      music, 
      status = 'published', 
      scheduledAt, 
      editingMetadata, 
      aiCaptions, 
      collaborators, 
      isRemix, 
      originalReel,
      downloadAllowed = false 
    } = req.body;

    if (!video || !video.url) {
      return res
        .status(400)
        .json({ success: false, message: 'Video is required' });
    }

    const hashtags = extractHashtags(caption);

    const reel = await Reel.create({
      user: req.user._id,
      caption,
      video,
      music: music || {},
      hashtags,
      status,
      scheduledAt,
      editingMetadata: editingMetadata || {},
      aiCaptions: aiCaptions || [],
      collaborators: collaborators || [],
      isRemix: !!isRemix,
      originalReel: originalReel || null,
      downloadAllowed
    });

    // Fire mention notifications
    if (caption) {
      const usernamesInCaption = extractMentions(caption);
      if (usernamesInCaption.length > 0) {
        const User = require('../models/User');
        const Notification = require('../models/Notification');
        const mentionedUsers = await User.find({
          username: { $in: usernamesInCaption },
        }).select('_id');
        
        await Promise.all(
          mentionedUsers
            .filter((u) => u._id.toString() !== req.user._id.toString())
            .map((u) =>
              Notification.create({
                recipient: u._id,
                sender: req.user._id,
                type: 'mention',
              })
            )
        );
      }
    }

    const populated = await reel.populate('user', 'username fullName profilePicture');
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single reel by ID
// @route   GET /api/reels/:id
// @access  Private
exports.getReelById = async (req, res, next) => {
  try {
    const reel = await Reel.findById(req.params.id)
      .populate('user', 'username fullName profilePicture')
      .populate({
        path: 'comments',
        options: { sort: { createdAt: -1 }, limit: 20 },
        populate: { path: 'user', select: 'username profilePicture' },
      });

    if (!reel) {
      return res.status(404).json({ success: false, message: 'Reel not found' });
    }

    res.status(200).json({ success: true, data: reel });
  } catch (error) {
    next(error);
  }
};

// @desc    Like / Unlike a reel
// @route   PUT /api/reels/:id/like
// @access  Private
exports.toggleLike = async (req, res, next) => {
  try {
    const reel = await Reel.findById(req.params.id);
    if (!reel) {
      return res.status(404).json({ success: false, message: 'Reel not found' });
    }

    const userId = req.user._id;
    const alreadyLiked = reel.likes.some((id) => id.toString() === userId.toString());

    if (alreadyLiked) {
      reel.likes = reel.likes.filter((id) => id.toString() !== userId.toString());
    } else {
      reel.likes.push(userId);

      // Fire like notification (not for self-likes)
      if (reel.user.toString() !== userId.toString()) {
        const Notification = require('../models/Notification');
        await Notification.create({
          recipient: reel.user,
          sender: userId,
          type: 'like',
          post: reel._id,
        });
      }
    }

    await reel.save();
    res.status(200).json({ success: true, likes: reel.likes.length, liked: !alreadyLiked });
  } catch (error) {
    next(error);
  }
};

// @desc    Increment view count
// @route   PUT /api/reels/:id/view
// @access  Private
exports.incrementViews = async (req, res, next) => {
  try {
    await Reel.findByIdAndUpdate(req.params.id, { $inc: { viewsCount: 1 } });
    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};

// @desc    Increment share count
// @route   PUT /api/reels/:id/share
// @access  Private
exports.incrementShares = async (req, res, next) => {
  try {
    await Reel.findByIdAndUpdate(req.params.id, { $inc: { sharesCount: 1 } });
    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a reel
// @route   DELETE /api/reels/:id
// @access  Private
exports.deleteReel = async (req, res, next) => {
  try {
    const reel = await Reel.findById(req.params.id);
    if (!reel) {
      return res.status(404).json({ success: false, message: 'Reel not found' });
    }
    if (reel.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorised' });
    }

    await reel.deleteOne();
    res.status(200).json({ success: true, message: 'Reel deleted' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Music Library Track List
// @route   GET /api/reels/music-library
// @access  Private
exports.getMusicLibrary = async (req, res, next) => {
  try {
    const tracks = [
      { id: 'm1', title: 'Golden Hour (Remix)', artist: 'JVKE', duration: '0:30', audioUrl: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3' },
      { id: 'm2', title: 'Cyberpunk Synthwave', artist: 'Neon Beats', duration: '0:45', audioUrl: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a8c430.mp3' },
      { id: 'm3', title: 'Lo-Fi Chill Hop', artist: 'Midnight Acoustic', duration: '0:30', audioUrl: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3' },
      { id: 'm4', title: 'Trending Pop Rhythm', artist: 'Acoustics', duration: '0:60', audioUrl: 'https://cdn.pixabay.com/download/audio/2022/10/14/audio_9939f1c7e9.mp3' },
      { id: 'm5', title: 'Aesthetic Chillout', artist: 'Vibe Producer', duration: '0:30', audioUrl: 'https://cdn.pixabay.com/download/audio/2022/08/02/audio_884fe92db1.mp3' }
    ];

    res.status(200).json({ success: true, data: tracks });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate AI Captions for Reel
// @route   POST /api/reels/generate-captions
// @access  Private
exports.generateAICaptions = async (req, res, next) => {
  try {
    const { captionStyle = 'Pop' } = req.body;

    const generatedCaptions = [
      { timestamp: '00:01', text: 'Hey guys! Check out this awesome vibe ✨' },
      { timestamp: '00:04', text: 'Creating amazing content with SnapGram AI 🚀' },
      { timestamp: '00:08', text: 'Don\'t forget to drop a like and follow!' }
    ];

    res.status(200).json({
      success: true,
      data: {
        captions: generatedCaptions,
        style: captionStyle
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Detailed Reel Analytics
// @route   GET /api/reels/:id/analytics
// @access  Private
exports.getReelAnalytics = async (req, res, next) => {
  try {
    const reel = await Reel.findById(req.params.id);
    if (!reel) {
      return res.status(404).json({ success: false, message: 'Reel not found' });
    }

    const likesCount = reel.likes ? reel.likes.length : 0;
    const viewsCount = reel.viewsCount || 100;
    const sharesCount = reel.shares ? reel.shares.length : 0;

    res.status(200).json({
      success: true,
      data: {
        reelId: reel._id,
        viewsCount,
        likesCount,
        sharesCount,
        avgWatchTime: '12.4s',
        totalWatchTimeHours: ((viewsCount * 12.4) / 3600).toFixed(2),
        retentionRate: 86.5,
        audienceReplayCount: Math.floor(viewsCount * 0.35)
      }
    });
  } catch (error) {
    next(error);
  }
};
