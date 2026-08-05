import api from './api';

export const getDashboardMetrics = async () => {
  const response = await api.get('/api/admin/metrics');
  return response.data;
};

export const getUsersList = async (params = {}) => {
  const response = await api.get('/api/admin/users', { params });
  return response.data;
};

export const updateUserStatus = async (userId, payload) => {
  const response = await api.put(`/api/admin/users/${userId}`, payload);
  return response.data;
};

export const getModerationQueue = async () => {
  const response = await api.get('/api/admin/reports');
  return response.data;
};

export const resolveReport = async (reportId, payload) => {
  const response = await api.put(`/api/admin/reports/${reportId}`, payload);
  return response.data;
};

export const getAuditLogs = async () => {
  const response = await api.get('/api/admin/audit-logs');
  return response.data;
};

export const broadcastNotification = async (payload) => {
  const response = await api.post('/api/admin/broadcast-notification', payload);
  return response.data;
};

export const getSystemConfig = async () => {
  const response = await api.get('/api/admin/system-config');
  return response.data;
};

export const updateSystemConfig = async (payload) => {
  const response = await api.put('/api/admin/system-config', payload);
  return response.data;
};
