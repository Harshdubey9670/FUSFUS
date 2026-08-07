const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');

// Tracks which sockets belong to which user.
// Map<userId (string), Set<socketId (string)>>
const onlineUsers = new Map(); 

// Tracks which users are actively viewing a conversation.
// Map<conversationId (string), Set<userId (string)>>
const conversationPresence = new Map();

let ioInstance;

const getOnlineUsersList = () => {
  return Array.from(onlineUsers.keys());
};

const initSocket = (io) => {
  ioInstance = io;
  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.user = user;
      next();
    } catch (err) {
      console.error('Socket Auth Error:', err);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();
    console.log(`User connected: ${userId} (Socket: ${socket.id})`);

    // 1. Join personal room for private notifications and chat
    socket.join(userId);

    // 2. Track online user
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId).add(socket.id);

    // 3. Broadcast updated online users list
    // Send to everyone, including the new socket
    io.emit('getOnlineUsers', getOnlineUsersList());

    // Handle Typing events
    socket.on('typing', (receiverId) => {
      io.to(receiverId).emit('typing', userId);
    });

    socket.on('stopTyping', (receiverId) => {
      io.to(receiverId).emit('stopTyping', userId);
    });

    // Handle Delivery Status
    socket.on('markDelivered', async ({ messageId, senderId }) => {
      try {
        await Message.findByIdAndUpdate(messageId, { status: 'delivered' });
        io.to(senderId).emit('messageDelivered', { messageId });
      } catch (err) {
        console.error('Error marking delivered:', err);
      }
    });

    // ─── Conversation Presence (Snapchat-style) ───
    const leaveConversation = (conversationId) => {
      if (!conversationId) return;
      const presence = conversationPresence.get(conversationId);
      if (presence) {
        presence.delete(userId);
        io.to(`conv_${conversationId}`).emit('conversationPresenceUpdate', Array.from(presence));
        if (presence.size === 0) {
          conversationPresence.delete(conversationId);
        }
      }
      socket.leave(`conv_${conversationId}`);
      socket.currentConversation = null;
    };

    socket.on('joinConversation', (conversationId) => {
      // Leave any existing conversation first
      if (socket.currentConversation && socket.currentConversation !== conversationId) {
        leaveConversation(socket.currentConversation);
      }

      socket.currentConversation = conversationId;
      socket.join(`conv_${conversationId}`);

      if (!conversationPresence.has(conversationId)) {
        conversationPresence.set(conversationId, new Set());
      }
      conversationPresence.get(conversationId).add(userId);

      // Broadcast to the room who is currently active
      io.to(`conv_${conversationId}`).emit('conversationPresenceUpdate', Array.from(conversationPresence.get(conversationId)));
    });

    socket.on('leaveConversation', (conversationId) => {
      leaveConversation(conversationId);
    });

    socket.on('chatScreenshot', ({ conversationId, receiverId }) => {
      // Notify the other user that a screenshot was taken of the chat
      io.to(receiverId).emit('chatScreenshotNotification', {
        conversationId,
        takenBy: socket.user.username,
        takenAt: new Date()
      });
    });

    // 4. Handle Disconnection
    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${userId} (Socket: ${socket.id})`);
      
      // Cleanup conversation presence
      if (socket.currentConversation) {
        leaveConversation(socket.currentConversation);
      }
      
      const userSockets = onlineUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          onlineUsers.delete(userId);
          io.emit('getOnlineUsers', getOnlineUsersList());
          
          // Update lastSeen in DB
          try {
            await User.findByIdAndUpdate(userId, { lastSeen: new Date() });
          } catch (err) {
            console.error('Error updating lastSeen:', err);
          }
        }
      }
    });

    // ==========================================
    // LIVE STREAMING & WEBRTC SIGNALING
    // ==========================================

    socket.on('join-live', ({ streamId }) => {
      socket.join(`live_${streamId}`);
      // Notify host that a viewer joined so they can initiate a PeerConnection offer
      socket.to(`live_${streamId}`).emit('viewer-joined', { viewerId: socket.id, userId });
    });

    socket.on('leave-live', ({ streamId }) => {
      socket.leave(`live_${streamId}`);
      socket.to(`live_${streamId}`).emit('viewer-left', { viewerId: socket.id, userId });
    });

    // WebRTC Signaling
    socket.on('webrtc-offer', ({ target, offer, streamId }) => {
      io.to(target).emit('webrtc-offer', { caller: socket.id, offer, streamId });
    });

    socket.on('webrtc-answer', ({ target, answer, streamId }) => {
      io.to(target).emit('webrtc-answer', { caller: socket.id, answer, streamId });
    });

    socket.on('webrtc-ice-candidate', ({ target, candidate, streamId }) => {
      io.to(target).emit('webrtc-ice-candidate', { caller: socket.id, candidate, streamId });
    });

    // Live Stream Chat & Reactions
    socket.on('live-chat-message', ({ streamId, text }) => {
      // Broadcast to everyone in the room, including sender (or sender can optimistically render)
      io.to(`live_${streamId}`).emit('live-chat-message', {
        user: {
          _id: userId,
          username: socket.user.username,
          avatar: socket.user.avatar,
          profilePicture: socket.user.profilePicture,
        },
        text,
        timestamp: new Date()
      });
    });

    socket.on('live-like', ({ streamId }) => {
      // Just emit a lightweight event to trigger the heart animation
      io.to(`live_${streamId}`).emit('live-like', { userId });
    });

  });
};

module.exports = {
  initSocket,
  getIo: () => ioInstance,
};
