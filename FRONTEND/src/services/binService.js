import api from "./api";

export const getBinsByRack = async (rackId) => {
  const response = await api.get(`/api/bins/rack/${rackId}`);
  return response.data;
};

// Returns bins with their current status (occupied/empty and quantity)
export const getBinsWithStatusByRack = async (rackId) => {
  const response = await api.get(`/api/bins/rack/${rackId}/with-status`);
  return response.data;
};

export const createBin = async (binData) => {
  const response = await api.post("/api/bins/create", binData);
  return response.data;
};

export const updateBin = async (binId, binData) => {
  const response = await api.put(`/api/bins/update/${binId}`, {
    name: binData.name,
    code: binData.code,
    capacity: binData.capacity,
  });
  return response.data;
};

export const deleteBin = async (binId) => {
  const response = await api.delete(`/api/bins/delete/${binId}`);
  return response.data;
};
