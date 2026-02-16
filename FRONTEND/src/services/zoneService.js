import api from './api';

export const getAllZones = async () => {
  const response = await api.get('/api/zones/all');
  return response.data;
};

export const getZoneStatistics = async () => {
  const response = await api.get('/api/zones/statistics');
  return response.data;
};

export const getZoneById = async (zoneId) => {
  const response = await api.get(`/api/zones/${zoneId}`);
  return response.data;
};

export const createZone = async (zoneData) => {
  const response = await api.post('/api/zones/create', zoneData);
  return response.data;
};

export const updateZone = async (zoneId, zoneData) => {
  const response = await api.put(`/api/zones/update/${zoneId}`, zoneData);
  return response.data;
};

export const deleteZone = async (zoneId) => {
  const response = await api.delete(`/api/zones/delete/${zoneId}`);
  return response.data;
};

export const getProductAllocationByZone = async (zoneId) => {
  const response = await api.get(`/api/zones/${zoneId}/product-allocation`);
  return response.data;
};
