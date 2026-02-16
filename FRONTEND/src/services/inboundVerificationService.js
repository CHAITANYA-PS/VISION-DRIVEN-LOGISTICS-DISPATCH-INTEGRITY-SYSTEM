import api from './api';

export const verifyPackage = async (shipmentItemId, imageFile) => {
  const formData = new FormData();
  formData.append('image', imageFile);
  
  const response = await api.post(
    `/api/inbound-verification/verify/${shipmentItemId}`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return response.data;
};

export const getShipmentItemsWithLocations = async (shipmentId) => {
  const response = await api.get(
    `/api/inbound-verification/shipment-items/${shipmentId}`
  );
  return response.data;
};

export const dispatchShipmentItem = async (shipmentItemId) => {
  const response = await api.post(
    `/api/shipment-items/${shipmentItemId}/dispatch`
  );
  return response.data;
};






