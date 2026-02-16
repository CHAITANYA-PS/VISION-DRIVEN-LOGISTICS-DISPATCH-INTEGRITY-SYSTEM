import api from './api';

export const createIssue = async (issueData) => {
  const response = await api.post('/api/issues/create', issueData);
  return response.data;
};

export const getAllIssues = async (status = null) => {
  const url = status ? `/api/issues?status=${status}` : '/api/issues';
  const response = await api.get(url);
  return response.data;
};

export const getIssueById = async (id) => {
  const response = await api.get(`/api/issues/${id}`);
  return response.data;
};

export const acknowledgeIssue = async (id) => {
  const response = await api.patch(`/api/issues/${id}/acknowledge`);
  return response.data;
};


















