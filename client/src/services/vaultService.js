import api from './api';

export const verifyVaultPin = async (pin) => {
  const response = await api.post('/api/vault/verify-pin', { pin });
  return response.data;
};

export const setVaultPin = async (pin) => {
  const response = await api.post('/api/vault/set-pin', { pin });
  return response.data;
};

export const getMemories = async (params = {}) => {
  const response = await api.get('/api/vault/memories', { params });
  return response.data;
};

export const addMemory = async (payload) => {
  const response = await api.post('/api/vault/memories', payload);
  return response.data;
};

export const toggleFavoriteMemory = async (id) => {
  const response = await api.put(`/api/vault/memories/${id}/favorite`);
  return response.data;
};

export const softDeleteMemory = async (id) => {
  const response = await api.delete(`/api/vault/memories/${id}`);
  return response.data;
};

export const getTrashBin = async () => {
  const response = await api.get('/api/vault/trash');
  return response.data;
};

export const restoreMemory = async (id) => {
  const response = await api.post(`/api/vault/restore/${id}`);
  return response.data;
};

export const getVaultAlbums = async () => {
  const response = await api.get('/api/vault/albums');
  return response.data;
};

export const createVaultAlbum = async (payload) => {
  const response = await api.post('/api/vault/albums', payload);
  return response.data;
};

export const generateShareLink = async (memoryId) => {
  const response = await api.post('/api/vault/share-link', { memoryId });
  return response.data;
};
