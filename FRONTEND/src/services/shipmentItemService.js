import api from "./api";

export const createBatchItems = async (items) => {
  const response = await api.post("/api/shipment-items/batch", items);
  return response.data;
};

export const getItemsByShipment = async (shipmentId) => {
  const response = await api.get(`/api/shipment-items/shipment/${shipmentId}`);
  return response.data;
};

export const createShipmentItem = async (item) => {
  const response = await api.post("/api/shipment-items/create", item);
  return response.data;
};

export const updateShipmentItem = async (id, item) => {
  const response = await api.put(`/api/shipment-items/update/${id}`, item);
  return response.data;
};

export const deleteShipmentItem = async (id) => {
  const response = await api.delete(`/api/shipment-items/delete/${id}`);
  return response.data;
};

export const getAssignedShipmentItems = async () => {
  const response = await api.get('/api/shipment-items/worker/assigned');
  return response.data;
};







