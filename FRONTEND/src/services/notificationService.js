import api from './api';

export const getNotificationsByUser = async (userId) => {
  const response = await api.get(`/api/notifications/user/${userId}`);
  return response.data;
};

export const markNotificationAsRead = async (id) => {
  const response = await api.patch(`/api/notifications/${id}/read`);
  return response.data;
};

export const deleteNotification = async (id) => {
  const response = await api.delete(`/api/notifications/${id}`);
  return response.data;
};

export const createNotification = async (notificationData) => {
  const response = await api.post('/api/notifications/create', notificationData);
  return response.data;
};
