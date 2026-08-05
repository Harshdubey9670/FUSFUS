const mongoose = require('mongoose');

const systemConfigSchema = new mongoose.Schema({
  maintenanceMode: {
    type: Boolean,
    default: false
  },
  featureFlags: {
    liveStreaming: { type: Boolean, default: true },
    monetization: { type: Boolean, default: true },
    aiAssistant: { type: Boolean, default: true },
    reelsUpload: { type: Boolean, default: true },
    storiesUpload: { type: Boolean, default: true }
  },
  announcementBanner: {
    enabled: { type: Boolean, default: false },
    message: { type: String, default: '' },
    type: { type: String, enum: ['info', 'warning', 'critical'], default: 'info' }
  }
}, { timestamps: true });

const SystemConfig = mongoose.model('SystemConfig', systemConfigSchema);
module.exports = SystemConfig;
