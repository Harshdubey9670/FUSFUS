import api from './api';

export const getEarningsOverview = async () => {
  const response = await api.get('/api/monetization/earnings');
  return response.data;
};

export const subscribeToCreator = async (creatorId, tier, price) => {
  const response = await api.post('/api/monetization/subscribe', { creatorId, tier, price });
  return response.data;
};

export const sendTip = async (creatorId, amount, message) => {
  const response = await api.post('/api/monetization/tip', { creatorId, amount, message });
  return response.data;
};

export const purchaseBadge = async (creatorId, badgeType, price) => {
  const response = await api.post('/api/monetization/badge', { creatorId, badgeType, price });
  return response.data;
};

export const getAffiliateLinks = async () => {
  const response = await api.get('/api/monetization/affiliates');
  return response.data;
};

export const addAffiliateLink = async (title, url) => {
  const response = await api.post('/api/monetization/affiliates', { title, url });
  return response.data;
};

export const getPayoutHistory = async () => {
  const response = await api.get('/api/monetization/payouts');
  return response.data;
};

export const requestPayout = async (amount, paymentMethod) => {
  const response = await api.post('/api/monetization/payouts/request', { amount, paymentMethod });
  return response.data;
};

export const getTaxInfo = async () => {
  const response = await api.get('/api/monetization/tax-info');
  return response.data;
};

export const updateTaxInfo = async (payload) => {
  const response = await api.post('/api/monetization/tax-info', payload);
  return response.data;
};
