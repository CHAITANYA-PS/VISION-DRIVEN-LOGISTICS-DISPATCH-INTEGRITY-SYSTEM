import api from './api';

export const getAllUsers = async () => {
  const response = await api.get('/api/users/getallusersDTOs');
  return response.data;
};

export const getWorkers = async () => {
  const response = await api.get('/api/users/workers');
  return response.data;
};

export const getUserById = async (id) => {
  const response = await api.get(`/api/users/${id}`);
  return response.data;
};

export const createUser = async (userData) => {
  const response = await api.post('/api/users/create', userData);
  return response.data;
};

export const updateUser = async (id, userData) => {
  const response = await api.put(`/api/users/${id}`, userData);
  return response.data;
};

export const deleteUser = async (id) => {
  const response = await api.delete(`/api/users/${id}`);
  return response.data;
};
