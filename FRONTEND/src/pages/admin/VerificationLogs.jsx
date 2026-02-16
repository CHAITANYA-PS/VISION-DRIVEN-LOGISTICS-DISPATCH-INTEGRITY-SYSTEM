import { useState, useEffect, useRef } from 'react';
import { Eye, CheckCircle, AlertTriangle, TrendingUp, Download, MoreVertical, Search, Edit, Trash2, X } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Badge from '../../components/common/Badge';
import Table, { TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/common/Table';
import Loading from '../../components/common/Loading';
import Alert from '../../components/common/Alert';
import Modal from '../../components/common/Modal';
import { StatsCard } from '../../components/shared/StatsCard';
import { getAllVerificationLogs, getVerificationSummary, exportVerificationLogsToCSV, updateVerificationLog, deleteVerificationLog } from '../../services/verificationLogService';
import { formatDateTime } from '../../utils/formatters';

export default function VerificationLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [operationFilter, setOperationFilter] = useState('ALL');
  const [resultFilter, setResultFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  
  // Modal
  const [selectedLog, setSelectedLog] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRefs = useRef({});
  
  // Edit form state
  const [editFormData, setEditFormData] = useState({
    result: '',
    aiConfidence: '',
    extractedSku: '',
    extractedProductCode: '',
    extractedWeight: '',
    extractedColor: '',
    extractedDimensions: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openMenuId !== null) {
        const menuElement = menuRefs.current[openMenuId];
        if (menuElement && !menuElement.contains(event.target)) {
          setOpenMenuId(null);
        }
      }
    };

    if (openMenuId !== null) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [openMenuId]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [logsData, summaryData] = await Promise.all([
        getAllVerificationLogs(),
        getVerificationSummary()
      ]);
      setLogs(logsData);
      setSummary(summaryData);
    } catch (err) {
      setError('Failed to load verification logs');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = async () => {
    setLoading(true);
    setError('');
    try {
      const filters = {};
      if (searchTerm) filters.search = searchTerm;
      if (operationFilter !== 'ALL') filters.operation = operationFilter;
      if (resultFilter !== 'ALL') filters.result = resultFilter;
      if (statusFilter !== 'ALL') filters.status = statusFilter;
      
      const logsData = await getAllVerificationLogs(filters);
      setLogs(logsData);
    } catch (err) {
      setError('Failed to filter verification logs');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    exportVerificationLogsToCSV(logs);
  };

  const handleViewDetails = (log) => {
    setSelectedLog(log);
    setShowDetailsModal(true);
    setOpenMenuId(null);
  };

  const handleEdit = (log) => {
    setSelectedLog(log);
    setEditFormData({
      result: log.result || '',
      aiConfidence: log.aiConfidence || '',
      extractedSku: log.extractedSku || '',
      extractedProductCode: log.extractedProductCode || '',
      extractedWeight: log.extractedWeight || '',
      extractedColor: log.extractedColor || '',
      extractedDimensions: log.extractedDimensions || ''
    });
    setShowEditModal(true);
    setOpenMenuId(null);
  };

  const handleDelete = (log) => {
    setSelectedLog(log);
    setShowDeleteModal(true);
    setOpenMenuId(null);
  };

  const handleSaveEdit = async () => {
    if (!selectedLog) return;

    setLoading(true);
    setError('');
    try {
      const updateData = {
        result: editFormData.result,
        aiConfidence: editFormData.aiConfidence ? parseFloat(editFormData.aiConfidence) : null,
        extractedSku: editFormData.extractedSku,
        extractedProductCode: editFormData.extractedProductCode,
        extractedWeight: editFormData.extractedWeight,
        extractedColor: editFormData.extractedColor,
        extractedDimensions: editFormData.extractedDimensions
      };

      await updateVerificationLog(selectedLog.id, updateData);
      setShowEditModal(false);
      await fetchData(); // Refresh data
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update verification log');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedLog) return;

    setLoading(true);
    setError('');
    try {
      await deleteVerificationLog(selectedLog.id);
      setShowDeleteModal(false);
      setSelectedLog(null);
      await fetchData(); // Refresh data
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete verification log');
    } finally {
      setLoading(false);
    }
  };

  const toggleMenu = (logId, event) => {
    if (event) {
      event.stopPropagation();
    }
    setOpenMenuId(openMenuId === logId ? null : logId);
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 80) return 'green';
    if (confidence >= 50) return 'yellow';
    return 'red';
  };

  const getResultBadgeVariant = (result) => {
    if (result === 'MATCH') return 'green';
    if (result === 'MISMATCH') return 'red';
    return 'yellow';
  };

  const getStatusBadgeVariant = (status) => {
    if (status === 'AUTO_APPROVED') return 'blue';
    if (status === 'SUPERVISOR_APPROVED') return 'green';
    if (status === 'REJECTED') return 'red';
    return 'yellow';
  };

  const formatStatus = (status) => {
    if (status === 'AUTO_APPROVED') return 'Auto-Approved';
    if (status === 'SUPERVISOR_APPROVED') return 'Supervisor Approved';
    if (status === 'REJECTED') return 'Rejected';
    if (status === 'PENDING') return 'Pending';
    return status;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">AI Verification Log</h1>
        <p className="text-gray-600 mt-1">Track all AI-powered product verifications performed by employees</p>
      </div>

      {error && (
        <Alert variant="error" onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Verifications"
            value={summary.totalVerifications}
            icon={Eye}
            iconBgColor="bg-blue-50"
            iconColor="text-blue-600"
          />
          <StatsCard
            title="Auto-Approved"
            value={summary.autoApproved}
            icon={CheckCircle}
            iconBgColor="bg-green-50"
            iconColor="text-green-600"
          />
          <StatsCard
            title="Pending Review"
            value={summary.pendingReview}
            icon={AlertTriangle}
            iconBgColor="bg-orange-50"
            iconColor="text-orange-600"
          />
          <StatsCard
            title="Average Confidence"
            value={`${summary.averageConfidence.toFixed(1)}%`}
            icon={TrendingUp}
            iconBgColor="bg-purple-50"
            iconColor="text-purple-600"
          />
        </div>
      )}

      {/* Verification History Section */}
      <Card>
        <div className="p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Verification History</h2>
          
          {/* Search and Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-1">
              <Input
                placeholder="Search by employee, product, or SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={Search}
              />
            </div>
            <Select
              value={operationFilter}
              onChange={(e) => setOperationFilter(e.target.value)}
              options={[
                { value: 'ALL', label: 'All Operations' },
                { value: 'INBOUND', label: 'Inbound' },
                { value: 'OUTBOUND', label: 'Outbound' },
                { value: 'PUTAWAY', label: 'Putaway' },
              ]}
            />
            <Select
              value={resultFilter}
              onChange={(e) => setResultFilter(e.target.value)}
              options={[
                { value: 'ALL', label: 'All Results' },
                { value: 'MATCH', label: 'Match' },
                { value: 'MISMATCH', label: 'Mismatch' },
                { value: 'LOW_CONFIDENCE', label: 'Low Confidence' },
              ]}
            />
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'ALL', label: 'All Status' },
                { value: 'AUTO_APPROVED', label: 'Auto-Approved' },
                { value: 'SUPERVISOR_APPROVED', label: 'Supervisor Approved' },
                { value: 'REJECTED', label: 'Rejected' },
                { value: 'PENDING', label: 'Pending' },
              ]}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button variant="primary" onClick={handleApplyFilters}>
              <Search size={18} className="mr-2" />
              Apply Filters
            </Button>
            <Button variant="outline" onClick={handleExportCSV} disabled={logs.length === 0}>
              <Download size={18} className="mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <Loading text="Loading verification logs..." />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Operation</TableHead>
                  <TableHead>Product / SKU</TableHead>
                  <TableHead>AI Confidence</TableHead>
                  <TableHead>Result</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm">
                      {formatDateTime(log.timestamp)}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium text-gray-900">{log.employeeName}</div>
                        <div className="text-sm text-gray-500">{log.employeeEmail}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={log.operation === 'INBOUND' ? 'blue' : 'purple'}>
                        {log.operation}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium text-gray-900">{log.productName}</div>
                        <div className="text-sm text-gray-500">{log.skuCode}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getConfidenceColor(log.aiConfidence)}>
                        {log.aiConfidence ? `${log.aiConfidence.toFixed(1)}%` : 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getResultBadgeVariant(log.result)}>
                        {log.result === 'MATCH' ? 'Match' : log.result === 'MISMATCH' ? 'Mismatch' : 'Damaged'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(log.status)}>
                        {formatStatus(log.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDetails(log);
                          }}
                          className="p-1 hover:bg-gray-100 rounded transition-colors"
                          title="View Details"
                        >
                          <Eye size={18} className="text-gray-600" />
                        </button>
                        <div 
                          className="relative"
                          ref={(el) => {
                            if (el) {
                              menuRefs.current[log.id] = el;
                            } else {
                              delete menuRefs.current[log.id];
                            }
                          }}
                        >
                          <button
                            onClick={(e) => toggleMenu(log.id, e)}
                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                            title="More Options"
                          >
                            <MoreVertical size={18} className="text-gray-600" />
                          </button>
                          {openMenuId === log.id && (
                            <div 
                              className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg z-50 border border-gray-200"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="py-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEdit(log);
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 transition-colors"
                                >
                                  <Edit size={16} />
                                  Edit
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(log);
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center gap-2 transition-colors"
                                >
                                  <Trash2 size={16} />
                                  Delete
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {logs.length === 0 && !loading && (
              <div className="text-center py-12 text-gray-500">
                <AlertTriangle size={48} className="mx-auto mb-4 text-gray-400" />
                <p>No verification logs found.</p>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Details Modal */}
      {showDetailsModal && selectedLog && (
        <Modal
          isOpen={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          title="Verification Details"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Employee Information</h4>
                <p className="text-sm"><span className="font-medium">Name:</span> {selectedLog.employeeName}</p>
                <p className="text-sm"><span className="font-medium">Email:</span> {selectedLog.employeeEmail}</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Operation Details</h4>
                <p className="text-sm"><span className="font-medium">Type:</span> {selectedLog.operation}</p>
                <p className="text-sm"><span className="font-medium">Timestamp:</span> {formatDateTime(selectedLog.timestamp)}</p>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Product Information</h4>
              <p className="text-sm"><span className="font-medium">Product:</span> {selectedLog.productName}</p>
              <p className="text-sm"><span className="font-medium">Product Code:</span> {selectedLog.productCode}</p>
              <p className="text-sm"><span className="font-medium">SKU:</span> {selectedLog.skuCode}</p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Verification Results</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Expected</p>
                  <p className="text-sm"><span className="font-medium">SKU:</span> {selectedLog.expectedSku}</p>
                  <p className="text-sm"><span className="font-medium">Product Code:</span> {selectedLog.expectedProductCode}</p>
                  {selectedLog.expectedWeight && <p className="text-sm"><span className="font-medium">Weight:</span> {selectedLog.expectedWeight}</p>}
                  {selectedLog.expectedColor && <p className="text-sm"><span className="font-medium">Color:</span> {selectedLog.expectedColor}</p>}
                  {selectedLog.expectedDimensions && <p className="text-sm"><span className="font-medium">Dimensions:</span> {selectedLog.expectedDimensions}</p>}
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Detected</p>
                  <p className="text-sm"><span className="font-medium">SKU:</span> {selectedLog.extractedSku}</p>
                  <p className="text-sm"><span className="font-medium">Product Code:</span> {selectedLog.extractedProductCode}</p>
                  {selectedLog.extractedWeight && <p className="text-sm"><span className="font-medium">Weight:</span> {selectedLog.extractedWeight}</p>}
                  {selectedLog.extractedColor && <p className="text-sm"><span className="font-medium">Color:</span> {selectedLog.extractedColor}</p>}
                  {selectedLog.extractedDimensions && <p className="text-sm"><span className="font-medium">Dimensions:</span> {selectedLog.extractedDimensions}</p>}
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-700 mb-2">AI Analysis</h4>
              <p className="text-sm"><span className="font-medium">Confidence:</span> {selectedLog.aiConfidence ? `${selectedLog.aiConfidence.toFixed(1)}%` : 'N/A'}</p>
              <p className="text-sm"><span className="font-medium">Result:</span> <Badge variant={getResultBadgeVariant(selectedLog.result)}>{selectedLog.result}</Badge></p>
              <p className="text-sm"><span className="font-medium">Status:</span> <Badge variant={getStatusBadgeVariant(selectedLog.status)}>{formatStatus(selectedLog.status)}</Badge></p>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedLog && (
        <Modal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          title="Edit Verification Log"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Result
              </label>
              <Select
                value={editFormData.result}
                onChange={(e) => setEditFormData({ ...editFormData, result: e.target.value })}
                options={[
                  { value: 'MATCH', label: 'Match' },
                  { value: 'MISMATCH', label: 'Mismatch' },
                  { value: 'LOW_CONFIDENCE', label: 'Low Confidence' },
                ]}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                AI Confidence (%)
              </label>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={editFormData.aiConfidence}
                onChange={(e) => setEditFormData({ ...editFormData, aiConfidence: e.target.value })}
                placeholder="Enter confidence percentage"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Extracted SKU
              </label>
              <Input
                value={editFormData.extractedSku}
                onChange={(e) => setEditFormData({ ...editFormData, extractedSku: e.target.value })}
                placeholder="Enter extracted SKU"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Extracted Product Code
              </label>
              <Input
                value={editFormData.extractedProductCode}
                onChange={(e) => setEditFormData({ ...editFormData, extractedProductCode: e.target.value })}
                placeholder="Enter extracted product code"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Extracted Weight
              </label>
              <Input
                value={editFormData.extractedWeight}
                onChange={(e) => setEditFormData({ ...editFormData, extractedWeight: e.target.value })}
                placeholder="Enter extracted weight"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Extracted Color
              </label>
              <Input
                value={editFormData.extractedColor}
                onChange={(e) => setEditFormData({ ...editFormData, extractedColor: e.target.value })}
                placeholder="Enter extracted color"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Extracted Dimensions
              </label>
              <Input
                value={editFormData.extractedDimensions}
                onChange={(e) => setEditFormData({ ...editFormData, extractedDimensions: e.target.value })}
                placeholder="Enter extracted dimensions"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSaveEdit}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedLog && (
        <Modal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          title="Delete Verification Log"
        >
          <div className="space-y-4">
            <p className="text-gray-700">
              Are you sure you want to delete this verification log? This action cannot be undone.
            </p>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Log ID:</span> #{selectedLog.id}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Employee:</span> {selectedLog.employeeName}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Product:</span> {selectedLog.productName}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Timestamp:</span> {formatDateTime(selectedLog.timestamp)}
              </p>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirmDelete}
                disabled={loading}
                className="bg-red-600 hover:bg-red-700"
              >
                {loading ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

