import api from './api';

export const chatAssistant = async (prompt, conversationHistory = []) => {
  const response = await api.post('/api/ai/assistant', { prompt, conversationHistory });
  return response.data;
};

export const generateCaption = async (topic, tone) => {
  const response = await api.post('/api/ai/caption', { topic, tone });
  return response.data;
};

export const generateHashtags = async (topic) => {
  const response = await api.post('/api/ai/hashtags', { topic });
  return response.data;
};

export const generateBio = async (niche, vibe) => {
  const response = await api.post('/api/ai/bio', { niche, vibe });
  return response.data;
};

export const suggestUsernames = async (name, interest) => {
  const response = await api.post('/api/ai/usernames', { name, interest });
  return response.data;
};

export const generatePostIdeas = async (category) => {
  const response = await api.post('/api/ai/post-ideas', { category });
  return response.data;
};

export const suggestComments = async (postContext) => {
  const response = await api.post('/api/ai/comments', { postContext });
  return response.data;
};

export const translateText = async (text, targetLang) => {
  const response = await api.post('/api/ai/translate', { text, targetLang });
  return response.data;
};

export const moderateContent = async (text) => {
  const response = await api.post('/api/ai/moderate', { text });
  return response.data;
};

export const detectFakeAccount = async (targetUserId) => {
  const response = await api.post('/api/ai/fake-account-check', { targetUserId });
  return response.data;
};

export const generateAltText = async (imageDescription) => {
  const response = await api.post('/api/ai/alt-text', { imageDescription });
  return response.data;
};
