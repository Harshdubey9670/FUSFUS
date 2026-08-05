const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  targetType: {
    type: String,
    enum: ['post', 'user', 'comment', 'story', 'reel'],
    required: true
  },
  targetId: {
    type: String,
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'dismissed'],
    default: 'pending'
  },
  actionTaken: {
    type: String,
    default: 'None'
  }
}, { timestamps: true });

const Report = mongoose.model('Report', reportSchema);
module.exports = Report;
