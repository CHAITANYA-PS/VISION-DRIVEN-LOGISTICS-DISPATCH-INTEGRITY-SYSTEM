import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Loading from '../../components/common/Loading';
import Alert from '../../components/common/Alert';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getAnalytics } from '../../services/reportService';

export default function Reports() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [analytics, setAnalytics] = useState(null);
  const [dateRange, setDateRange] = useState({
    start: '',
    end: '',
  });

  useEffect(() => {
    fetchAnalytics(dateRange.start, dateRange.end);
  }, []);

  const fetchAnalytics = async (startDate = null, endDate = null) => {
    try {
      setLoading(true);
      setError('');
      const data = await getAnalytics(startDate || null, endDate || null);
      setAnalytics(data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilter = () => {
    if (dateRange.start && dateRange.end) {
      if (new Date(dateRange.start) > new Date(dateRange.end)) {
        setError('Start date must be before end date');
        return;
      }
    }
    fetchAnalytics(dateRange.start, dateRange.end);
  };

  const handleClearFilter = () => {
    setDateRange({ start: '', end: '' });
    fetchAnalytics(null, null);
  };

  const handleExport = () => {
    if (analytics) {
      const dataStr = JSON.stringify(analytics, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `operations-report-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  if (loading) return <Loading text="Loading analytics..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Operations Reports</h1>
          <p className="text-gray-600 mt-1">Monitor operations and warehouse analytics</p>
        </div>
        <Button variant="primary" onClick={handleExport} disabled={!analytics}>
          <Download size={20} className="mr-2" />
          Export Report
        </Button>
      </div>

      {error && (
        <Alert variant="error" onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Date Range Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Date Range Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="md:col-span-1">
              <Input
                label="Start Date"
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              />
            </div>
            <div className="md:col-span-1">
              <Input
                label="End Date"
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              />
            </div>
            <div className="md:col-span-2 flex gap-2">
              <Button 
                variant="primary" 
                onClick={handleApplyFilter}
                disabled={loading || (!dateRange.start || !dateRange.end)}
              >
                Apply Filter
              </Button>
              <Button 
                variant="secondary" 
                onClick={handleClearFilter}
                disabled={loading || (!dateRange.start && !dateRange.end)}
              >
                Clear Filter
              </Button>
            </div>
          </div>
          {(!dateRange.start || !dateRange.end) && (
            <p className="text-sm text-gray-500 mt-2">
              Showing default data (last 6 months). Select a date range to filter.
            </p>
          )}
        </CardContent>
      </Card>

      {analytics && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm font-medium text-gray-500">Total Users</div>
                <div className="text-3xl font-bold text-gray-900 mt-2">{analytics.totalUsers}</div>
                <div className="text-sm text-green-600 mt-1">Active in system</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm font-medium text-gray-500">Total Shipments</div>
                <div className="text-3xl font-bold text-gray-900 mt-2">{analytics.totalShipments}</div>
                <div className="text-sm text-blue-600 mt-1">
                  {dateRange.start && dateRange.end ? 'Filtered range' : 'All time'}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm font-medium text-gray-500">AI Mismatches</div>
                <div className="text-3xl font-bold text-gray-900 mt-2">{analytics.totalMismatches}</div>
                <div className="text-sm text-orange-600 mt-1">
                  {dateRange.start && dateRange.end ? 'Filtered range' : 'All time'}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm font-medium text-gray-500">Total SKUs</div>
                <div className="text-3xl font-bold text-gray-900 mt-2">{analytics.totalSkus}</div>
                <div className="text-sm text-green-600 mt-1">In inventory</div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>
                  Shipment Trends
                  {dateRange.start && dateRange.end 
                    ? ` (${new Date(dateRange.start).toLocaleDateString()} - ${new Date(dateRange.end).toLocaleDateString()})`
                    : ' (Last 6 Months)'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analytics.shipmentTrends && analytics.shipmentTrends.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analytics.shipmentTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="inbound" fill="#2563EB" name="Inbound" />
                      <Bar dataKey="outbound" fill="#10B981" name="Outbound" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-gray-500">
                    No data available for the selected date range
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Inbound vs Outbound</CardTitle>
              </CardHeader>
              <CardContent>
                {analytics.shipmentTrends && analytics.shipmentTrends.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analytics.shipmentTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="inbound" stroke="#14B8A6" name="Inbound" strokeWidth={2} />
                      <Line type="monotone" dataKey="outbound" stroke="#8B5CF6" name="Outbound" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-gray-500">
                    No data available for the selected date range
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
