import api from './api';

export const getOverviewStats = async (timeframe = '30d') => {
  const response = await api.get(`/api/creator/overview?timeframe=${timeframe}`);
  return response.data;
};

export const getInsights = async (timeframe = '30d') => {
  const response = await api.get(`/api/creator/insights?timeframe=${timeframe}`);
  return response.data;
};

export const getAudienceAnalytics = async () => {
  const response = await api.get('/api/creator/audience');
  return response.data;
};

export const getContentPerformance = async (type = 'all') => {
  const response = await api.get(`/api/creator/content?type=${type}`);
  return response.data;
};

export const getDraftsAndScheduled = async () => {
  const response = await api.get('/api/creator/content-manager');
  return response.data;
};

export const bulkContentAction = async (payload) => {
  const response = await api.post('/api/creator/bulk-action', payload);
  return response.data;
};

export const downloadAnalyticsReport = () => {
  window.open('http://localhost:5000/api/creator/export', '_blank');
};
