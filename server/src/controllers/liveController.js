const LiveStream = require('../models/LiveStream');
const User = require('../models/User');
const { emitToAll } = require('../socket'); // I need to ensure this works or broadcast via active users

// Start a live stream
exports.startLiveStream = async (req, res) => {
  try {
    const { title } = req.body;
    
    // Check if user already has an active stream
    const existingStream = await LiveStream.findOne({ host: req.user._id, status: 'live' });
    if (existingStream) {
      existingStream.status = 'ended';
      existingStream.endTime = Date.now();
      await existingStream.save();
    }

    const liveStream = await LiveStream.create({
      host: req.user._id,
      title: title || `${req.user.username}'s Live`,
      status: 'live',
    });

    // Populate host info for clients
    await liveStream.populate('host', 'username profilePicture avatar isVerified');

    // Here we'd ideally emit an event to followers that host went live
    // req.io.emit('newLiveStream', liveStream);

    res.status(201).json({
      success: true,
      data: liveStream
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// End a live stream
exports.endLiveStream = async (req, res) => {
  try {
    const stream = await LiveStream.findById(req.params.id);
    
    if (!stream) {
      return res.status(404).json({ success: false, message: 'Stream not found' });
    }

    if (stream.host.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to end this stream' });
    }

    stream.status = 'ended';
    stream.endTime = Date.now();
    await stream.save();

    res.status(200).json({
      success: true,
      data: stream
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get active live streams
exports.getActiveStreams = async (req, res) => {
  try {
    const streams = await LiveStream.find({ status: 'live' })
      .populate('host', 'username profilePicture avatar isVerified')
      .sort('-createdAt')
      .limit(10);

    res.status(200).json({
      success: true,
      data: streams
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get a specific stream
exports.getStream = async (req, res) => {
  try {
    const stream = await LiveStream.findById(req.params.id)
      .populate('host', 'username profilePicture avatar isVerified');
      
    if (!stream) {
      return res.status(404).json({ success: false, message: 'Stream not found' });
    }

    res.status(200).json({
      success: true,
      data: stream
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
