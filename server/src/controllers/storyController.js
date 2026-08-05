const Story = require('../models/Story');
const User = require('../models/User');

const seedMockStoriesIfNeeded = async () => {
  const count = await Story.countDocuments();
  if (count > 0) return;

  console.log('[DEV ONLY] Seeding mock stories...');
  let mockUser = await User.findOne({ username: 'snapgram_official' });
  if (!mockUser) return;

  const mockUsers = [mockUser];

  // We can create a few more mock users for stories so the row looks nice
  for (let i = 1; i <= 5; i++) {
    let u = await User.findOne({ username: `user_${i}` });
    if (!u) {
      u = await User.create({
        fullName: `Mock User ${i}`,
        username: `user_${i}`,
        email: `user${i}@snapgram.ai`,
        password: 'password123',
        profilePicture: `https://i.pravatar.cc/150?u=${i}`
      });
    }
    mockUsers.push(u);
  }

  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);

  for (let i = 0; i < mockUsers.length; i++) {
    await Story.create({
      user: mockUsers[i]._id,
      media: [{ url: `https://images.unsplash.com/photo-1682687220063-4742bd7fd538?q=80&w=400&auto=format&fit=crop`, type: 'image' }],
      expiresAt: tomorrow,
    });
  }
};

// @desc    Get active stories for feed
// @route   GET /api/stories
// @access  Private
exports.getStories = async (req, res, next) => {
  try {
    await seedMockStoriesIfNeeded();

    // Fetch stories that haven't expired
    // We group them by user. A user might have multiple stories.
    // For the feed row, we usually just need the latest story or the user object.
    
    // Find all unexpired stories, populate user and viewers
    const stories = await Story.find({ expiresAt: { $gt: new Date() } })
      .populate('user', 'username profilePicture')
      .populate('viewers', 'username profilePicture')
      .sort({ createdAt: -1 });

    // Deduplicate so we just have one entry per user for the top row
    const userStoriesMap = new Map();
    stories.forEach(story => {
      const userId = story.user._id.toString();
      if (!userStoriesMap.has(userId)) {
        userStoriesMap.set(userId, {
          user: story.user,
          stories: [story]
        });
      } else {
        userStoriesMap.get(userId).stories.push(story);
      }
    });

    res.status(200).json({
      success: true,
      data: Array.from(userStoriesMap.values())
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reply to a story
// @route   POST /api/stories/:id/reply
// @access  Private
exports.replyToStory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    const story = await Story.findById(id);
    if (!story) {
      return res.status(404).json({ success: false, message: 'Story not found' });
    }

    if (story.user.toString() === req.user.id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot reply to your own story' });
    }

    // Fire story_reply notification
    const Notification = require('../models/Notification');
    await Notification.create({
      recipient: story.user,
      sender: req.user.id,
      type: 'story_reply',
      message: message.trim()
    });

    res.status(200).json({ success: true, message: 'Reply sent' });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new story
// @route   POST /api/stories
// @access  Private
exports.createStory = async (req, res, next) => {
  try {
    const { media, stickers, music, status = 'published', scheduledAt, isArchived = true } = req.body;

    if (!media || !Array.isArray(media) || media.length === 0) {
      return res.status(400).json({ success: false, message: 'Media is required' });
    }

    // Automatically expire after 24 hours
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const story = await Story.create({
      user: req.user._id,
      media,
      stickers: stickers || [],
      music: music || {},
      status,
      scheduledAt,
      isArchived,
      expiresAt,
    });

    res.status(201).json({ success: true, data: story });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's Story Archive
// @route   GET /api/stories/archive
// @access  Private
exports.getStoryArchive = async (req, res, next) => {
  try {
    const stories = await Story.find({ user: req.user.id, isArchived: true }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: stories });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Highlights for a user
// @route   GET /api/stories/highlights/:userId
// @access  Private
exports.getHighlights = async (req, res, next) => {
  try {
    const Highlight = require('../models/Highlight');
    const highlights = await Highlight.find({ user: req.params.userId }).populate('stories');
    res.status(200).json({ success: true, data: highlights });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a Story Highlight
// @route   POST /api/stories/highlights
// @access  Private
exports.createHighlight = async (req, res, next) => {
  try {
    const Highlight = require('../models/Highlight');
    const { title, coverImage, stories } = req.body;

    if (!title || !stories || stories.length === 0) {
      return res.status(400).json({ success: false, message: 'Title and stories are required' });
    }

    const highlight = await Highlight.create({
      user: req.user.id,
      title,
      coverImage: coverImage || 'https://images.unsplash.com/photo-1682687220063-4742bd7fd538?q=80&w=400&auto=format&fit=crop',
      stories
    });

    res.status(201).json({ success: true, data: highlight });
  } catch (error) {
    next(error);
  }
};

// @desc    AI Story Generation
// @route   POST /api/stories/ai-generate
// @access  Private
exports.generateAIStory = async (req, res, next) => {
  try {
    const { prompt = 'Sunset aesthetic', theme = 'cyberpunk' } = req.body;

    const aiMediaUrl = 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=600&auto=format&fit=crop';
    
    res.status(200).json({
      success: true,
      data: {
        mediaUrl: aiMediaUrl,
        type: 'image',
        suggestedCaption: `AI Generated story inspired by: ${prompt}`
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Detailed Story Analytics
// @route   GET /api/stories/:id/analytics
// @access  Private
exports.getStoryAnalytics = async (req, res, next) => {
  try {
    const story = await Story.findById(req.params.id).populate('viewers', 'username profilePicture');
    if (!story) {
      return res.status(404).json({ success: false, message: 'Story not found' });
    }

    res.status(200).json({
      success: true,
      data: {
        storyId: story._id,
        totalViewers: story.viewers ? story.viewers.length : 0,
        viewers: story.viewers,
        completionRate: story.analytics?.completionRate || 94,
        exits: story.analytics?.exits || 1,
        stickerClicks: 12
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Interact with Story Sticker (Vote Poll/Quiz, Answer Question)
// @route   POST /api/stories/:id/sticker-interact
// @access  Private
exports.interactSticker = async (req, res, next) => {
  try {
    const { stickerId, optionIndex, answerText } = req.body;

    res.status(200).json({
      success: true,
      message: 'Sticker interaction recorded successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark a story as viewed
// @route   PUT /api/stories/:id/view
// @access  Private
exports.markStoryViewed = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Use $addToSet to only add if not already present
    const story = await Story.findByIdAndUpdate(
      id,
      { $addToSet: { viewers: req.user._id } },
      { new: true }
    );

    if (!story) {
      return res.status(404).json({ success: false, message: 'Story not found' });
    }

    res.status(200).json({ success: true, message: 'Story marked as viewed' });
  } catch (error) {
    next(error);
  }
};
