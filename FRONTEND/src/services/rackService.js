import api from "./api";

export const getRacksByZone = async (zoneId) => {
  const response = await api.get(`/api/racks/zone/${zoneId}`);
  return response.data;
};

export const getRacksWithBinsByZone = async (zoneId) => {
  const response = await api.get(`/api/racks/zone/${zoneId}/with-bins`);
  return response.data;
};

export const createRack = async (rackData) => {
  const response = await api.post("/api/racks/create", {
    zoneId: rackData.zoneId,
    name: rackData.name,
    description: rackData.description || "",
  });
  return response.data;
};

export const updateRack = async (rackId, rackData) => {
  const response = await api.put(`/api/racks/update/${rackId}`, {
    name: rackData.name,
    description: rackData.description || "",
  });
  return response.data;
};

export const deleteRack = async (rackId) => {
  const response = await api.delete(`/api/racks/delete/${rackId}`);
  return response.data;
};
