import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Package } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Loading from '../../components/common/Loading';
import Alert from '../../components/common/Alert';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import { formatDateTime } from '../../utils/formatters';
import { getPendingApprovals, approveRequest, rejectRequest } from '../../services/approvalService';

export default function Approvals() {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchApprovals();
  }, []);

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      const data = await getPendingApprovals();
      setApprovals(data);
    } catch (err) {
      setError('Failed to load approvals');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (approval) => {
    try {
      setProcessing(true);
      setError('');
      await approveRequest(approval.id);
      setSuccess('Approval request approved successfully');
      // Remove from list
      setApprovals(approvals.filter(a => a.id !== approval.id));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve request');
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectClick = (approval) => {
    setSelectedApproval(approval);
    setShowRejectModal(true);
    setRejectReason('');
  };

  const handleRejectConfirm = async () => {
    if (!rejectReason.trim()) {
      setError('Please provide a reason for rejection');
      return;
    }

    try {
      setProcessing(true);
      setError('');
      await rejectRequest(selectedApproval.id, rejectReason);
      setSuccess('Approval request rejected');
      // Remove from list
      setApprovals(approvals.filter(a => a.id !== selectedApproval.id));
      setShowRejectModal(false);
      setSelectedApproval(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject request');
    } finally {
      setProcessing(false);
    }
  };

  const parseExtractedData = (jsonString) => {
    try {
      return JSON.parse(jsonString);
    } catch {
      return {};
    }
  };

  const parseExpectedData = (jsonString) => {
    try {
      return JSON.parse(jsonString);
    } catch {
      return {};
    }
  };

  if (loading) return <Loading text="Loading approvals..." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pending Approvals</h1>
        <p className="text-gray-600 mt-1">Review and approve verification mismatches</p>
      </div>

      {error && (
        <Alert variant="error" onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <div className="space-y-4">
        {approvals.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <CheckCircle size={48} className="mx-auto mb-4 text-green-500" />
              <p className="text-gray-500">No pending approvals</p>
            </div>
          </Card>
        ) : (
          approvals.map((approval) => {
            const extractedData = parseExtractedData(approval.extractedData);
            const expectedData = parseExpectedData(approval.expectedData);

            return (
              <Card key={approval.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="red">Verification Mismatch</Badge>
                      <CardTitle>Approval Request #{approval.id}</CardTitle>
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatDateTime(approval.requestedAt)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <AlertTriangle className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
                      <div className="text-sm text-yellow-800">
                        <p className="font-medium mb-1">Mismatch Detected</p>
                        <p>{approval.reason}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Requested by:</span>
                        <span className="ml-2 font-medium">{approval.requestedByName}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Shipment Item:</span>
                        <span className="ml-2 font-medium">#{approval.shipmentItemId}</span>
                      </div>
                    </div>

                    {/* Comparison Table */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3">Verification Details</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2 px-3 text-gray-700">Field</th>
                              <th className="text-left py-2 px-3 text-gray-700">Expected</th>
                              <th className="text-left py-2 px-3 text-gray-700">Extracted</th>
                              <th className="text-center py-2 px-3 text-gray-700">Match</th>
                            </tr>
                          </thead>
                          <tbody>
                            <ComparisonRow
                              field="Product Code"
                              expected={expectedData.productCode}
                              extracted={extractedData.product_code || extractedData.productCode}
                            />
                            <ComparisonRow
                              field="SKU"
                              expected={expectedData.skuCode}
                              extracted={extractedData.sku}
                            />
                            <ComparisonRow
                              field="Weight"
                              expected={expectedData.weight}
                              extracted={extractedData.weight}
                            />
                            <ComparisonRow
                              field="Color"
                              expected={expectedData.color}
                              extracted={extractedData.color}
                            />
                            <ComparisonRow
                              field="Dimensions"
                              expected={expectedData.dimensions}
                              extracted={extractedData.dimensions}
                            />
                          </tbody>
                        </table>
                      </div>
                      {extractedData.confidence_score !== undefined && (
                        <div className="mt-3 text-sm">
                          <span className="text-gray-600">AI Confidence:</span>
                          <span className="ml-2 font-medium">
                            {(extractedData.confidence_score * 100).toFixed(1)}%
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-gray-200">
                      <Button
                        variant="primary"
                        onClick={() => handleApprove(approval)}
                        disabled={processing}
                      >
                        <CheckCircle size={20} className="mr-2" />
                        Approve & Assign to Bin
                      </Button>
                      <Button
                        variant="danger"
                        onClick={() => handleRejectClick(approval)}
                        disabled={processing}
                      >
                        <XCircle size={20} className="mr-2" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Reject Modal */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => !processing && setShowRejectModal(false)}
        title="Reject Approval Request"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Please provide a reason for rejecting this approval request.
          </p>
          <Input
            label="Rejection Reason"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Enter reason for rejection..."
            multiline
            rows={3}
          />
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => setShowRejectModal(false)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleRejectConfirm}
              disabled={processing || !rejectReason.trim()}
            >
              {processing ? 'Rejecting...' : 'Confirm Rejection'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function ComparisonRow({ field, expected, extracted }) {
  const matches = expected === extracted || (!expected && !extracted);
  
  return (
    <tr className="border-b last:border-0">
      <td className="py-2 px-3 font-medium text-gray-700">{field}</td>
      <td className="py-2 px-3 text-gray-600">{expected || '-'}</td>
      <td className="py-2 px-3 text-gray-600">{extracted || '-'}</td>
      <td className="py-2 px-3 text-center">
        {matches ? (
          <CheckCircle className="text-green-600 inline" size={16} />
        ) : (
          <XCircle className="text-red-600 inline" size={16} />
        )}
      </td>
    </tr>
  );
}

