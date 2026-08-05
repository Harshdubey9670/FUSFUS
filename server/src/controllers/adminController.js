const User = require('../models/User');
const Post = require('../models/Post');
const Reel = require('../models/Reel');
const Story = require('../models/Story');
const Report = require('../models/Report');
const AdminAuditLog = require('../models/AdminAuditLog');
const SystemConfig = require('../models/SystemConfig');
const Notification = require('../models/Notification');

// Helper to log admin actions
const logAdminAction = async (adminId, action, targetType, targetId, details) => {
  try {
    await AdminAuditLog.create({
      adminUser: adminId,
      action,
      targetType,
      targetId: targetId ? targetId.toString() : '',
      details
    });
  } catch (err) {
    console.error('Failed to log admin action:', err);
  }
};

// @desc    Get Platform Dashboard Metrics
// @route   GET /api/admin/metrics
// @access  Private/Admin
exports.getDashboardMetrics = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalPosts = await Post.countDocuments();
    const totalReels = await Reel.countDocuments();
    const pendingReports = await Report.countDocuments({ status: 'pending' });

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalPosts,
        totalReels,
        pendingReports,
        activeStreams: 3,
        totalRevenueUSD: 14850.00
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Paginated Users List
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getUsersList = async (req, res, next) => {
  try {
    const { search, role, isBanned } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (role) query.role = role;
    if (isBanned === 'true') query.isBanned = true;

    const users = await User.find(query).select('-password').sort({ createdAt: -1 }).limit(50);
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

// @desc    Update User Status / Role / Ban / Verification
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
exports.updateUserStatus = async (req, res, next) => {
  try {
    const { role, isBanned, isVerified } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (role) user.role = role;
    if (typeof isBanned === 'boolean') user.isBanned = isBanned;
    if (typeof isVerified === 'boolean') user.isVerified = isVerified;

    await user.save();

    const action = isBanned ? 'BAN_USER' : 'CHANGE_ROLE';
    await logAdminAction(req.user.id, action, 'User', user._id, `Updated status for @${user.username}`);

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Moderation Queue Reports
// @route   GET /api/admin/reports
// @access  Private/Admin
exports.getModerationQueue = async (req, res, next) => {
  try {
    const reports = await Report.find().populate('reporter', 'username profilePicture').sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: reports });
  } catch (error) {
    next(error);
  }
};

// @desc    Resolve or Dismiss Report / Remove Content
// @route   PUT /api/admin/reports/:id
// @access  Private/Admin
exports.resolveReport = async (req, res, next) => {
  try {
    const { actionTaken, removeContent } = req.body;
    const report = await Report.findById(req.params.id);

    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });

    report.status = actionTaken === 'dismiss' ? 'dismissed' : 'reviewed';
    report.actionTaken = actionTaken || 'Reviewed';
    await report.save();

    if (removeContent) {
      if (report.targetType === 'post') await Post.findByIdAndDelete(report.targetId);
      if (report.targetType === 'reel') await Reel.findByIdAndDelete(report.targetId);
      await logAdminAction(req.user.id, 'REMOVE_CONTENT', report.targetType, report.targetId, `Content removed due to report`);
    } else {
      await logAdminAction(req.user.id, 'DISMISS_REPORT', 'Report', report._id, `Report dismissed by admin`);
    }

    res.status(200).json({ success: true, message: 'Report resolved successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Audit Logs
// @route   GET /api/admin/audit-logs
// @access  Private/Admin
exports.getAuditLogs = async (req, res, next) => {
  try {
    const logs = await AdminAuditLog.find().populate('adminUser', 'username fullName profilePicture').sort({ createdAt: -1 }).limit(100);
    res.status(200).json({ success: true, data: logs });
  } catch (error) {
    next(error);
  }
};

// @desc    Broadcast System Notification
// @route   POST /api/admin/broadcast-notification
// @access  Private/Admin
exports.broadcastNotification = async (req, res, next) => {
  try {
    const { title, message } = req.body;
    if (!title || !message) return res.status(400).json({ success: false, message: 'Title and message are required' });

    const allUsers = await User.find().select('_id');
    const notifications = allUsers.map(u => ({
      recipient: u._id,
      sender: req.user.id,
      type: 'system_announcement',
      message: `${title}: ${message}`
    }));

    await Notification.insertMany(notifications);
    await logAdminAction(req.user.id, 'BROADCAST_NOTIFICATION', 'Notification', '', `Broadcast message: "${title}"`);

    res.status(200).json({ success: true, message: `Notification broadcasted to ${allUsers.length} users` });
  } catch (error) {
    next(error);
  }
};

// @desc    Get System Config & Feature Flags
// @route   GET /api/admin/system-config
// @access  Private/Admin
exports.getSystemConfig = async (req, res, next) => {
  try {
    let config = await SystemConfig.findOne();
    if (!config) {
      config = await SystemConfig.create({
        maintenanceMode: false,
        featureFlags: { liveStreaming: true, monetization: true, aiAssistant: true, reelsUpload: true, storiesUpload: true }
      });
    }
    res.status(200).json({ success: true, data: config });
  } catch (error) {
    next(error);
  }
};

// @desc    Update System Config & Feature Flags
// @route   PUT /api/admin/system-config
// @access  Private/Admin
exports.updateSystemConfig = async (req, res, next) => {
  try {
    const { maintenanceMode, featureFlags, announcementBanner } = req.body;
    let config = await SystemConfig.findOne();
    if (!config) config = new SystemConfig();

    if (typeof maintenanceMode === 'boolean') config.maintenanceMode = maintenanceMode;
    if (featureFlags) config.featureFlags = { ...config.featureFlags, ...featureFlags };
    if (announcementBanner) config.announcementBanner = { ...config.announcementBanner, ...announcementBanner };

    await config.save();
    await logAdminAction(req.user.id, 'UPDATE_SYSTEM_CONFIG', 'SystemConfig', config._id, 'Updated system settings & feature flags');

    res.status(200).json({ success: true, data: config });
  } catch (error) {
    next(error);
  }
};
