const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
  {
    isGroupChat: {
      type: Boolean,
      default: false,
    },
    chatName: {
      type: String,
      trim: true,
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    groupAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    latestMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
    },
  },
  {
    timestamps: true,
  }
);

// Optimize querying a user's conversations sorted by the most recent activity (updatedAt)
conversationSchema.index({ participants: 1, updatedAt: -1 });

// Optimize exact one-to-one chat lookups (finding a conversation with exactly two specific participants)
conversationSchema.index({ isGroupChat: 1, participants: 1 });

const Conversation = mongoose.model('Conversation', conversationSchema);

module.exports = Conversation;
