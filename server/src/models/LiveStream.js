const mongoose = require('mongoose');

const liveStreamSchema = new mongoose.Schema({
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    trim: true,
    default: 'Live Stream',
  },
  status: {
    type: String,
    enum: ['scheduled', 'live', 'ended'],
    default: 'live',
  },
  viewers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  likes: {
    type: Number,
    default: 0,
  },
  startTime: {
    type: Date,
    default: Date.now,
  },
  endTime: {
    type: Date,
  },
  recordingUrl: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
});

const LiveStream = mongoose.model('LiveStream', liveStreamSchema);
module.exports = LiveStream;
