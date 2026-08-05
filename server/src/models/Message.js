const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },
    messageType: {
      type: String,
      enum: ['text', 'image', 'video', 'voice', 'file', 'snap'],
      default: 'text',
    },
    text: {
      type: String,
      trim: true,
    },
    mediaUrl: {
      type: String,
    },
    mediaPublicId: {
      type: String,
    },
    fileName: {
      type: String,
    },
    fileSize: {
      type: Number,
    },
    duration: {
      type: Number,
    },
    
    // Snapchat Disappearing Snaps Features
    isSnap: {
      type: Boolean,
      default: false
    },
    snapTimer: {
      type: Number, // Seconds: 1 - 10, or 0 for infinite
      default: 10
    },
    viewMode: {
      type: String,
      enum: ['view_once', 'replay_once'],
      default: 'view_once'
    },
    viewCount: {
      type: Number,
      default: 0
    },
    isOpened: {
      type: Boolean,
      default: false
    },
    openedAt: {
      type: Date
    },
    screenshotTakenBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    replayCount: {
      type: Number,
      default: 0
    },

    status: {
      type: String,
      enum: ['sent', 'delivered', 'seen'],
      default: 'sent',
    },
    seenBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      }
    ],

    isEdited: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

messageSchema.index({ conversation: 1, createdAt: 1 });

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
