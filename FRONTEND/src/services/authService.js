import api from './api';
import { env } from '../config/env';

export const login = async (email, password) => {
  const response = await api.post('/api/auth/login', { email, password });
  const { token, role, userId } = response.data;
  
  if (token) {
    localStorage.setItem(env.TOKEN_KEY, token);
    localStorage.setItem(env.ROLE_KEY, role);
    localStorage.setItem(env.USER_ID_KEY, userId);
  }
  
  return response.data;
};

export const register = async (userData) => {
  const response = await api.post('/api/auth/register', userData);
  const { token, role, userId } = response.data;
  
  if (token) {
    localStorage.setItem(env.TOKEN_KEY, token);
    localStorage.setItem(env.ROLE_KEY, role);
    localStorage.setItem(env.USER_ID_KEY, userId);
  }
  
  return response.data;
};

export const logout = () => {
  localStorage.removeItem(env.TOKEN_KEY);
  localStorage.removeItem(env.ROLE_KEY);
  localStorage.removeItem(env.USER_ID_KEY);
  window.location.href = '/login';
};

export const getToken = () => localStorage.getItem(env.TOKEN_KEY);
export const getRole = () => localStorage.getItem(env.ROLE_KEY);
export const getUserId = () => localStorage.getItem(env.USER_ID_KEY);
export const isAuthenticated = () => !!getToken();
export const hasRole = (role) => getRole() === role;
export const isAdmin = () => hasRole('ADMIN');
export const isSupervisor = () => hasRole('SUPERVISOR');
export const isWorker = () => hasRole('WORKER');


