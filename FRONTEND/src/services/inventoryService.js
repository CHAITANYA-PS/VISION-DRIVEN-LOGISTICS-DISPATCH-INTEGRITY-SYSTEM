import api from './api';

export const getStock = async (skuId, binId) => {
  const response = await api.get(`/api/inventory/get/${skuId}/${binId}`, {
    params: { skuId, binId }
  });
  return response.data;
};

export const createStock = async (stockData) => {
  const response = await api.post('/api/inventory/create', stockData);
  return response.data;
};

export const updateStock = async (skuId, binId, quantity) => {
  const response = await api.put(`/api/inventory/update`, {
    skuId,
    binId,
    quantity
  });
  return response.data;
};

export const getAllInventory = async () => {
  const response = await api.get('/api/inventory/all');
  return response.data;
};

export const deleteInventoryStock = async (id) => {
  const response = await api.delete(`/api/inventory/delete/${id}`);
  return response.data;
};

export const transferStock = async (transferData) => {
  const response = await api.post('/api/inventory/transfer', transferData);
  return response.data;
};

export const updateInventoryQuantity = async (id, quantity) => {
  const response = await api.put(`/api/inventory/update/${id}`, { quantity });
  return response.data;
};