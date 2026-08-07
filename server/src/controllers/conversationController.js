const mongoose = require('mongoose');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');

const seedMockConversationsIfNeeded = async (userId) => {
  const count = await Conversation.countDocuments({ participants: userId });
  if (count > 0) return;

  console.log('[DEV ONLY] Seeding mock conversations for user:', userId);
  
  // Find other users to create chats with
  const otherUsers = await User.find({ _id: { $ne: userId } }).limit(5);
  
  for (let i = 0; i < otherUsers.length; i++) {
    const otherUser = otherUsers[i];
    
    // Create a temporary conversation ID
    const tempConvId = new mongoose.Types.ObjectId();
    
    const message = await Message.create({
      sender: otherUser._id,
      conversation: tempConvId,
      text: i % 2 === 0 ? `Hey, how are you doing? Let's catch up soon.` : `Check out this reel I sent you!`,
      status: 'delivered',
    });

    const conv = await Conversation.create({
      _id: tempConvId,
      isGroupChat: false,
      participants: [userId, otherUser._id],
      latestMessage: message._id,
    });
  }
};

// @desc    Get all conversations for the logged in user
// @route   GET /api/conversations
// @access  Private
exports.getConversations = async (req, res, next) => {
  try {
    await seedMockConversationsIfNeeded(req.user._id);

    const conversations = await Conversation.find({ participants: req.user._id })
      .populate('participants', 'username fullName profilePicture lastSeen')
      .populate({
        path: 'latestMessage',
        select: 'text messageType status seenBy sender isDeleted createdAt',
        populate: {
          path: 'sender',
          select: 'username'
        }
      })
      .sort({ updatedAt: -1 });

    res.status(200).json({ success: true, data: conversations });
  } catch (error) {
    next(error);
  }
};
