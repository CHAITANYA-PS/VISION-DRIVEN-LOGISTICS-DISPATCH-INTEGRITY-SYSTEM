import { useState, useEffect } from 'react';
import { AlertCircle, Send } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Alert from '../../components/common/Alert';
import Loading from '../../components/common/Loading';
import { createIssue } from '../../services/issueService';
import { getAssignedShipments } from '../../services/shipmentService';

export default function Issues() {
  const [loading, setLoading] = useState(false);
  const [loadingShipments, setLoadingShipments] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [shipments, setShipments] = useState([]);
  const [formData, setFormData] = useState({
    shipmentId: '',
    issueType: '',
    expectedSku: '',
    detectedSku: '',
    description: '',
    confidence: '',
  });

  useEffect(() => {
    fetchShipments();
  }, []);

  const fetchShipments = async () => {
    try {
      setLoadingShipments(true);
      console.log('=== Fetching assigned shipments ===');
      const shipmentList = await getAssignedShipments();
      console.log('Fetched shipments:', shipmentList);
      console.log('Number of shipments:', shipmentList?.length || 0);
      if (shipmentList && shipmentList.length > 0) {
        console.log('First shipment:', shipmentList[0]);
      }
      setShipments(shipmentList || []);
    } catch (err) {
      console.error('=== ERROR fetching shipments ===');
      console.error('Error:', err);
      console.error('Error message:', err.message);
      console.error('Error response:', err.response);
      console.error('Error response data:', err.response?.data);
      console.error('Error response status:', err.response?.status);
      setShipments([]);
      // Don't show error to user, just log it - shipment is optional
    } finally {
      setLoadingShipments(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
    setSuccess(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      const issueData = {
        issueType: formData.issueType,
        description: formData.description,
      };

      // Add shipment if provided
      if (formData.shipmentId) {
        issueData.shipment = {
          id: parseInt(formData.shipmentId)
        };
      }

      // Add SKU mismatch details if issue type is MISMATCH
      if (formData.issueType === 'MISMATCH') {
        if (formData.expectedSku) {
          issueData.expectedSku = formData.expectedSku;
        }
        if (formData.detectedSku) {
          issueData.detectedSku = formData.detectedSku;
        }
        if (formData.confidence) {
          issueData.confidence = parseFloat(formData.confidence) / 100; // Convert percentage to decimal
        }
      }

      const createdIssue = await createIssue(issueData);

      setSuccess(true);
      setFormData({
        shipmentId: '',
        issueType: '',
        expectedSku: '',
        detectedSku: '',
        description: '',
        confidence: '',
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to report issue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Report Issue</h1>
        <p className="text-gray-600 mt-1">Report problems, mismatches, or location issues</p>
      </div>

      {error && (
        <Alert variant="error" onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" onClose={() => setSuccess(false)}>
          Issue reported successfully! Status: OPEN
        </Alert>
      )}

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Select
                label="Shipment"
                name="shipmentId"
                value={formData.shipmentId}
                onChange={handleChange}
                disabled={loadingShipments}
                options={[
                  { value: '', label: loadingShipments ? 'Loading...' : 'Select shipment (optional)' },
                  ...shipments.map(shipment => ({
                    value: shipment.id.toString(),
                    label: `Shipment #${shipment.id} - ${shipment.shipmentType || 'N/A'} - ${shipment.status || 'N/A'}`
                  }))
                ]}
              />
              {!loadingShipments && shipments.length === 0 && (
                <p className="mt-1 text-sm text-amber-600">
                  No shipments assigned to you. Please contact your supervisor to get assigned shipments.
                </p>
              )}
            </div>

            <Select
              label="Issue Type"
              name="issueType"
              value={formData.issueType}
              onChange={handleChange}
              required
              options={[
                { value: '', label: 'Select issue type' },
                { value: 'MISMATCH', label: 'SKU Mismatch' },
                { value: 'DAMAGED', label: 'Damaged Item' },
                { value: 'LOCATION', label: 'Location Issue' },
                { value: 'OTHER', label: 'Other' },
              ]}
            />
          </div>

          {formData.issueType === 'MISMATCH' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Expected SKU"
                  name="expectedSku"
                  value={formData.expectedSku}
                  onChange={handleChange}
                  placeholder="Expected SKU code"
                />

                <Input
                  label="Detected SKU"
                  name="detectedSku"
                  value={formData.detectedSku}
                  onChange={handleChange}
                  placeholder="Detected SKU code"
                />
              </div>

              <Input
                label="Confidence Level (%)"
                name="confidence"
                type="number"
                min="0"
                max="100"
                value={formData.confidence}
                onChange={handleChange}
                placeholder="0-100"
              />
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Describe the issue in detail..."
              required
            />
          </div>

          <div className="flex gap-4">
            <Button type="submit" variant="primary" disabled={loading}>
              <Send size={20} className="mr-2" />
              {loading ? 'Submitting...' : 'Submit Report'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setFormData({
                  shipmentId: '',
                  issueType: '',
                  expectedSku: '',
                  detectedSku: '',
                  description: '',
                  confidence: '',
                });
                setError('');
                setSuccess(false);
              }}
            >
              Clear
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

