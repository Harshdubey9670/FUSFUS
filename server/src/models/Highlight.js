const mongoose = require('mongoose');

const highlightSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 30
  },
  coverImage: {
    type: String,
    required: true
  },
  stories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Story'
  }]
}, {
  timestamps: true
});

const Highlight = mongoose.model('Highlight', highlightSchema);
module.exports = Highlight;
