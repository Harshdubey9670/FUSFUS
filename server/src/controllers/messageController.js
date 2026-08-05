const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const { getIo } = require('../socket');

// @desc    Get Chat Messages
// @route   GET /api/messages/:conversationId
// @access  Private
exports.getMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    
    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.participants.includes(req.user._id)) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    const messages = await Message.find({ conversation: conversationId, isDeleted: false })
      .populate('sender', 'username profilePicture')
      .sort({ createdAt: 1 });

    // Mark unread messages as seen
    const unreadMessages = await Message.updateMany(
      { conversation: conversationId, sender: { $ne: req.user._id }, status: { $ne: 'seen' } },
      { $set: { status: 'seen' }, $addToSet: { seenBy: req.user._id } }
    );

    if (unreadMessages.modifiedCount > 0) {
      const io = getIo();
      if (io) {
        conversation.participants.forEach((participantId) => {
          if (participantId.toString() !== req.user._id.toString()) {
            io.to(participantId.toString()).emit('messagesSeen', { conversationId });
          }
        });
      }
    }
    
    res.status(200).json({ success: true, data: messages });
  } catch (error) {
    next(error);
  }
};

// @desc    Send Chat Message or Snap
// @route   POST /api/messages/:conversationId
// @access  Private
exports.sendMessage = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const { 
      text, 
      messageType = 'text', 
      mediaUrl,
      isSnap = false,
      snapTimer = 10,
      viewMode = 'view_once'
    } = req.body;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.participants.includes(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Verify block relationship between participants
    const User = require('../models/User');
    const sender = await User.findById(req.user._id);
    const otherParticipantIds = conversation.participants.filter(p => p.toString() !== req.user._id.toString());
    const otherUsers = await User.find({ _id: { $in: otherParticipantIds } });

    const isBlockedByAny = otherUsers.some(u => 
      (u.blockedUsers || []).some(bId => bId && bId.toString() === req.user._id.toString())
    );
    const hasBlockedAny = otherUsers.some(u => 
      (sender.blockedUsers || []).some(bId => bId && bId.toString() === u._id.toString())
    );

    if (isBlockedByAny || hasBlockedAny) {
      return res.status(403).json({ success: false, message: 'Messaging is disabled due to user block settings.' });
    }

    const newMessage = await Message.create({
      sender: req.user._id,
      conversation: conversationId,
      text,
      messageType: isSnap ? 'snap' : messageType,
      mediaUrl,
      isSnap,
      snapTimer: Number(snapTimer) || 10,
      viewMode,
      status: 'sent',
    });

    await newMessage.populate('sender', 'username profilePicture');

    conversation.latestMessage = newMessage._id;
    await conversation.save();

    const io = getIo();
    if (io) {
      conversation.participants.forEach((participantId) => {
        if (participantId.toString() !== req.user._id.toString()) {
          io.to(participantId.toString()).emit('newMessage', newMessage);
        }
      });
    }

    res.status(201).json({ success: true, data: newMessage });
  } catch (error) {
    next(error);
  }
};

// @desc    Open / View Disappearing Snap
// @route   POST /api/messages/snap/:messageId/open
// @access  Private
exports.openSnap = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const message = await Message.findById(messageId);

    if (!message || !message.isSnap) {
      return res.status(404).json({ success: false, message: 'Snap not found' });
    }

    message.viewCount += 1;
    message.isOpened = true;
    message.openedAt = new Date();

    // Auto destruct handling: If view_once or reached view limit, mark deleted after timer
    if (message.viewMode === 'view_once' && message.viewCount >= 1) {
      setTimeout(async () => {
        try {
          message.isDeleted = true;
          await message.save();
          const io = getIo();
          if (io) {
            io.to(message.conversation.toString()).emit('snapExpired', { messageId: message._id });
          }
        } catch (e) { console.error('Snap auto-delete error', e); }
      }, (message.snapTimer || 10) * 1000);
    }

    await message.save();

    const io = getIo();
    if (io) {
      io.to(message.sender.toString()).emit('snapOpened', {
        messageId: message._id,
        openedBy: req.user.username,
        openedAt: message.openedAt
      });
    }

    res.status(200).json({ success: true, data: message });
  } catch (error) {
    next(error);
  }
};

// @desc    Report Screenshot Architecture Trigger
// @route   POST /api/messages/snap/:messageId/screenshot
// @access  Private
exports.reportScreenshot = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const message = await Message.findById(messageId).populate('sender', 'username');

    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    if (!message.screenshotTakenBy.includes(req.user._id)) {
      message.screenshotTakenBy.push(req.user._id);
      await message.save();
    }

    const io = getIo();
    if (io) {
      io.to(message.sender._id.toString()).emit('screenshotNotification', {
        messageId: message._id,
        takenBy: req.user.username,
        takenAt: new Date()
      });
    }

    res.status(200).json({ success: true, message: 'Screenshot reported to sender' });
  } catch (error) {
    next(error);
  }
};
