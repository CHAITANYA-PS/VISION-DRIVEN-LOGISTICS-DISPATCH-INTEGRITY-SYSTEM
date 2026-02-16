import api from "./api";

export const getAnalytics = async (startDate = null, endDate = null) => {
  const params = {};
  if (startDate) {
    params.startDate = startDate;
  }
  if (endDate) {
    params.endDate = endDate;
  }
  
  const response = await api.get("/api/reports/analytics", { params });
  return response.data;
};
