import axios from "axios";
import { env } from "../config/env";

const api = axios.create({
  baseURL: env.API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - adds JWT token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(env.TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handles errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(env.TOKEN_KEY);
      localStorage.removeItem(env.ROLE_KEY);
      localStorage.removeItem(env.USER_ID_KEY);
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
