const mongoose = require('mongoose');

const adminAuditLogSchema = new mongoose.Schema({
  adminUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'BAN_USER', 
      'UNBAN_USER', 
      'CHANGE_ROLE', 
      'APPROVE_VERIFICATION', 
      'REMOVE_CONTENT', 
      'DISMISS_REPORT', 
      'BROADCAST_NOTIFICATION', 
      'UPDATE_SYSTEM_CONFIG'
    ]
  },
  targetType: {
    type: String,
    enum: ['User', 'Post', 'Comment', 'Report', 'SystemConfig', 'Notification'],
    required: true
  },
  targetId: {
    type: String,
    default: ''
  },
  details: {
    type: String,
    default: ''
  },
  ipAddress: {
    type: String,
    default: '127.0.0.1'
  }
}, { timestamps: true });

const AdminAuditLog = mongoose.model('AdminAuditLog', adminAuditLogSchema);
module.exports = AdminAuditLog;
