import api from "./api";

export const getPendingApprovals = async () => {
  const response = await api.get("/api/approvals/pending");
  return response.data;
};

export const approveRequest = async (approvalId) => {
  const response = await api.post(`/api/approvals/${approvalId}/approve`);
  return response.data;
};

export const rejectRequest = async (approvalId, reason) => {
  const response = await api.post(`/api/approvals/${approvalId}/reject`, {
    reason,
  });
  return response.data;
};




