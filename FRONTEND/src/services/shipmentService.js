import api from "./api";

export const getAllShipments = async () => {
  const response = await api.get("/api/shipments");
  return response.data;
};

export const getShipmentById = async (id) => {
  const response = await api.get(`/api/shipments/${id}`);
  return response.data;
};

export const createShipment = async (shipmentData) => {
  const response = await api.post("/api/shipments/create", shipmentData);
  return response.data;
};

export const updateShipment = async (id, shipmentData) => {
  const response = await api.put(`/api/shipments/${id}`, shipmentData);
  return response.data;
};

export const assignShipment = async (id, userId) => {
  const response = await api.patch(`/api/shipments/${id}/assign`, { userId });
  return response.data;
};

export const assignWorkers = async (shipmentId, workerIds) => {
  const response = await api.post(`/api/shipments/${shipmentId}/assign-workers`, workerIds);
  return response.data;
};

export const removeWorker = async (shipmentId, workerId) => {
  const response = await api.delete(`/api/shipments/${shipmentId}/workers/${workerId}`);
  return response.data;
};

export const getAssignedWorkers = async (shipmentId) => {
  const response = await api.get(`/api/shipments/${shipmentId}/workers`);
  return response.data;
};

export const deleteShipment = async (id) => {
  const response = await api.delete(`/api/shipments/${id}`);
  // 204 No Content doesn't have a body, so return null or empty object
  return response.data || null;
};

export const getAssignedShipments = async () => {
  const response = await api.get('/api/shipments/worker/assigned');
  return response.data;
};
