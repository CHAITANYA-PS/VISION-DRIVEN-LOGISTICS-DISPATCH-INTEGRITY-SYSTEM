import { useState, useEffect, useRef } from 'react';
import { CheckCircle, AlertCircle, Clock, User, Package } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Loading from '../../components/common/Loading';
import Alert from '../../components/common/Alert';
import Select from '../../components/common/Select';
import { formatDateTime } from '../../utils/formatters';
import { getAllIssues, acknowledgeIssue } from '../../services/issueService';

export default function Issues() {
  const [issues, setIssues] = useState([]);
  const [filteredIssues, setFilteredIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [processing, setProcessing] = useState(false);
  const pollingIntervalRef = useRef(null);

  useEffect(() => {
    fetchIssues();
    
    // Set up polling every 5 seconds
    pollingIntervalRef.current = setInterval(() => {
      // Only poll if page is visible
      if (document.visibilityState === 'visible') {
        fetchIssues(false); // Don't show loading spinner on polling updates
      }
    }, 5000);

    // Cleanup interval on unmount
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // Filter issues based on status
    if (statusFilter === 'ALL') {
      setFilteredIssues(issues);
    } else {
      setFilteredIssues(issues.filter(issue => issue.status === statusFilter));
    }
  }, [issues, statusFilter]);

  const fetchIssues = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      setError('');
      const data = await getAllIssues();
      setIssues(data);
    } catch (err) {
      setError('Failed to load issues');
      console.error('Error fetching issues:', err);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  const handleAcknowledge = async (issue) => {
    try {
      setProcessing(true);
      setError('');
      await acknowledgeIssue(issue.id);
      setSuccess(`Issue #${issue.id} acknowledged successfully`);
      
      // Update the issue in the list
      setIssues(issues.map(i => 
        i.id === issue.id 
          ? { ...i, status: 'NOTED', acknowledgedByName: 'You', acknowledgedAt: new Date().toISOString() }
          : i
      ));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to acknowledge issue');
    } finally {
      setProcessing(false);
    }
  };

  const getIssueTypeLabel = (type) => {
    const labels = {
      'MISMATCH': 'SKU Mismatch',
      'DAMAGED': 'Damaged Item',
      'LOCATION': 'Location Issue',
      'OTHER': 'Other'
    };
    return labels[type] || type;
  };

  const getIssueTypeColor = (type) => {
    const colors = {
      'MISMATCH': 'red',
      'DAMAGED': 'orange',
      'LOCATION': 'blue',
      'OTHER': 'gray'
    };
    return colors[type] || 'gray';
  };

  if (loading) return <Loading text="Loading issues..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Issues</h1>
          <p className="text-gray-600 mt-1">View and acknowledge issues reported by workers</p>
        </div>
        <div className="w-48">
          <Select
            label="Filter by Status"
            name="statusFilter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: 'ALL', label: 'All Issues' },
              { value: 'OPEN', label: 'Open' },
              { value: 'NOTED', label: 'Noted' },
            ]}
          />
        </div>
      </div>

      {error && (
        <Alert variant="error" onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" onClose={() => setSuccess(false)}>
          {success}
        </Alert>
      )}

      <div className="space-y-4">
        {filteredIssues.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <CheckCircle size={48} className="mx-auto mb-4 text-green-500" />
              <p className="text-gray-500">
                {statusFilter === 'ALL' 
                  ? 'No issues reported yet' 
                  : `No ${statusFilter.toLowerCase()} issues`}
              </p>
            </div>
          </Card>
        ) : (
          filteredIssues.map((issue) => (
            <Card key={issue.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge 
                      variant={issue.status === 'OPEN' ? 'red' : 'green'}
                    >
                      {issue.status}
                    </Badge>
                    <CardTitle>Issue #{issue.id}</CardTitle>
                    <Badge variant={getIssueTypeColor(issue.issueType)}>
                      {getIssueTypeLabel(issue.issueType)}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-500 flex items-center gap-1">
                    <Clock size={16} />
                    {formatDateTime(issue.createdAt)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <User size={16} className="text-gray-400" />
                      <span className="text-gray-500">Reported by:</span>
                      <span className="font-medium">{issue.reportedByName || 'Unknown'}</span>
                    </div>
                    {issue.shipmentItemId && (
                      <div className="flex items-center gap-2">
                        <Package size={16} className="text-gray-400" />
                        <span className="text-gray-500">Shipment Item:</span>
                        <span className="font-medium">#{issue.shipmentItemId}</span>
                      </div>
                    )}
                  </div>

                  {issue.description && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{issue.description}</p>
                    </div>
                  )}

                  {issue.issueType === 'MISMATCH' && (issue.expectedSku || issue.detectedSku) && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <h4 className="font-medium text-yellow-900 mb-2">SKU Mismatch Details</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-yellow-700">Expected SKU:</span>
                          <span className="ml-2 font-medium">{issue.expectedSku || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-yellow-700">Detected SKU:</span>
                          <span className="ml-2 font-medium">{issue.detectedSku || 'N/A'}</span>
                        </div>
                        {issue.confidence !== null && issue.confidence !== undefined && (
                          <div className="col-span-2">
                            <span className="text-yellow-700">Confidence:</span>
                            <span className="ml-2 font-medium">
                              {(issue.confidence * 100).toFixed(1)}%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {issue.status === 'NOTED' && issue.acknowledgedByName && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle size={16} className="text-green-600" />
                        <span className="text-green-800">
                          Acknowledged by <strong>{issue.acknowledgedByName}</strong>
                          {issue.acknowledgedAt && (
                            <span className="ml-2">
                              on {formatDateTime(issue.acknowledgedAt)}
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  )}

                  {issue.status === 'OPEN' && (
                    <div className="flex gap-3 pt-4 border-t border-gray-200">
                      <Button
                        variant="primary"
                        onClick={() => handleAcknowledge(issue)}
                        disabled={processing}
                      >
                        <CheckCircle size={20} className="mr-2" />
                        {processing ? 'Acknowledging...' : 'Acknowledge Issue'}
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}


















