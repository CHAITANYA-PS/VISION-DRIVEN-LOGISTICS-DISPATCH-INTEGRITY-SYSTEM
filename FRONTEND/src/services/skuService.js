import api from "./api";

export const getAllSkus = async () => {
  const response = await api.get("/api/skus/getallskudto");
  return response.data;
};

export const getSkuById = async (id) => {
  const response = await api.get(`/api/skus/getbyid/${id}`);
  return response.data;
};

export const createSku = async (skuData) => {
  const response = await api.post("/api/skus/create", skuData);
  return response.data;
};

export const updateSku = async (id, skuData) => {
  const response = await api.put(`/api/skus/${id}`, skuData);
  return response.data;
};

export const deleteSku = async (id) => {
  const response = await api.delete(`/api/skus/delete/${id}`);
  return response.data;
};