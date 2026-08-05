const UserSettings = require('../models/UserSettings');
const User = require('../models/User');

// @desc    Get user settings
// @route   GET /api/settings
// @access  Private
exports.getSettings = async (req, res, next) => {
  try {
    let settings = await UserSettings.findOne({ user: req.user._id });

    // If settings don't exist for legacy users, create default
    if (!settings) {
      settings = await UserSettings.create({ user: req.user._id });
    }

    res.status(200).json({
      success: true,
      data: settings
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user settings
// @route   PUT /api/settings
// @access  Private
exports.updateSettings = async (req, res, next) => {
  try {
    let settings = await UserSettings.findOne({ user: req.user._id });

    if (!settings) {
      settings = await UserSettings.create({ user: req.user._id });
    }

    // Process nested updates (e.g. { "privacy.isPrivate": true })
    // req.body might come as structured object or flat dot-notation
    const updates = req.body;
    
    // Deep merge updates
    for (const category in updates) {
      if (typeof updates[category] === 'object' && !Array.isArray(updates[category]) && updates[category] !== null) {
        if (!settings[category]) settings[category] = {};
        for (const key in updates[category]) {
          settings[category][key] = updates[category][key];
        }
      } else {
        settings[category] = updates[category];
      }
    }

    await settings.save();

    // Keep User model isPrivate boolean in sync with UserSettings
    if (updates.privacy && updates.privacy.isPrivate !== undefined) {
      await User.findByIdAndUpdate(req.user._id, { isPrivate: updates.privacy.isPrivate });
    }

    res.status(200).json({
      success: true,
      data: settings
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Download user data as JSON file
// @route   GET /api/settings/download-data
// @access  Private
exports.downloadData = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password -otp -otpExpires')
      .populate('savedPosts', 'caption media createdAt')
      .populate('collections', 'name posts createdAt');
      
    const settings = await UserSettings.findOne({ user: req.user._id });
    
    // In a real production app, we would also fetch all Posts, Comments, Chats, etc.
    // For this module, we will aggregate the main data available right now.
    const Post = require('../models/Post');
    const posts = await Post.find({ user: req.user._id }).select('-user');

    const dataExport = {
      profile: user,
      settings: settings || {},
      posts: posts,
      exportDate: new Date().toISOString()
    };

    // Send as a downloadable JSON file
    res.setHeader('Content-disposition', `attachment; filename=snapgram_data_${req.user.username}.json`);
    res.setHeader('Content-type', 'application/json');
    res.status(200).send(JSON.stringify(dataExport, null, 2));

  } catch (error) {
    next(error);
  }
};
