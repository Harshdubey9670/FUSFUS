import api from './api';

export const startLiveStream = async (title) => {
  const response = await api.post('/api/live/start', { title });
  return response.data;
};

export const endLiveStream = async (streamId) => {
  const response = await api.post(`/api/live/${streamId}/end`);
  return response.data;
};

export const getActiveStreams = async () => {
  const response = await api.get('/api/live/active');
  return response.data;
};

export const getStream = async (streamId) => {
  const response = await api.get(`/api/live/${streamId}`);
  return response.data;
};
