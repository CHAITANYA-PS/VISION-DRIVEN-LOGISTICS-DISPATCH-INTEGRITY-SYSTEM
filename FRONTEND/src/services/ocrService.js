import axios from 'axios';

const OCR_BASE_URL = 'http://localhost:8000';

export const verifyLabel = async (imageFile, expectedData) => {
  const formData = new FormData();
  formData.append('file', imageFile);
  
  if (expectedData.productCode) {
    formData.append('expected_product_code', expectedData.productCode);
  }
  if (expectedData.skuCode) {
    formData.append('expected_sku', expectedData.skuCode);
  }
  if (expectedData.weight) {
    formData.append('expected_weight', expectedData.weight);
  }
  if (expectedData.color) {
    formData.append('expected_color', expectedData.color);
  }
  if (expectedData.dimensions) {
    formData.append('expected_dimensions', expectedData.dimensions);
  }
  
  const response = await axios.post(`${OCR_BASE_URL}/verify-label`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};






