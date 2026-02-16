import api from './api';

export const getVerificationLogsByShipmentItem = async (itemId) => {
  const response = await api.get(`/api/verification-logs/shipment-item/${itemId}`);
  return response.data;
};

export const createVerificationLog = async (logData) => {
  const response = await api.post('/api/verification-logs/create', logData);
  return response.data;
};

export const getAllVerificationLogs = async (filters = {}) => {
  const params = new URLSearchParams();
  
  if (filters.search) params.append('search', filters.search);
  if (filters.operation) params.append('operation', filters.operation);
  if (filters.result) params.append('result', filters.result);
  if (filters.status) params.append('status', filters.status);
  
  const queryString = params.toString();
  const url = `/api/verification-logs/all${queryString ? `?${queryString}` : ''}`;
  
  const response = await api.get(url);
  return response.data;
};

export const getVerificationSummary = async () => {
  const response = await api.get('/api/verification-logs/summary');
  return response.data;
};

export const exportVerificationLogsToCSV = (logs) => {
  if (!logs || logs.length === 0) {
    return;
  }

  // Define CSV headers
  const headers = [
    'Log ID',
    'Timestamp',
    'Employee Name',
    'Employee ID',
    'Operation',
    'Product Name',
    'Product Code',
    'SKU Code',
    'AI Confidence (%)',
    'Result',
    'Status'
  ];

  // Convert logs to CSV rows
  const rows = logs.map(log => [
    log.id || '',
    log.timestamp || '',
    log.employeeName || '',
    log.employeeEmail || '',
    log.operation || '',
    log.productName || '',
    log.productCode || '',
    log.skuCode || '',
    log.aiConfidence ? log.aiConfidence.toFixed(1) : '',
    log.result || '',
    log.status || ''
  ]);

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `verification-logs-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const updateVerificationLog = async (id, logData) => {
  const response = await api.put(`/api/verification-logs/${id}`, logData);
  return response.data;
};

export const deleteVerificationLog = async (id) => {
  const response = await api.delete(`/api/verification-logs/${id}`);
  return response.data;
};

