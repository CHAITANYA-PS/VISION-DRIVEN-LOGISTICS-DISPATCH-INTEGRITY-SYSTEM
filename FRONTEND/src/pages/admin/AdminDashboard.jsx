import { useState, useEffect } from 'react';
import { Package, AlertTriangle, Warehouse, TrendingUp } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { StatsCard } from '../../components/shared/StatsCard';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import Button from '../../components/common/Button';
import { Link } from 'react-router-dom';
import Loading from '../../components/common/Loading';
import Alert from '../../components/common/Alert';
import { getAnalytics } from '../../services/reportService';
import FloatingChatButton from '../../components/features/chat/FloatingChatButton';

const quickLinks = [
  { label: 'Manage Products', path: '/products', icon: Package },
  { label: 'View Shipments', path: '/shipments', icon: TrendingUp },
  { label: 'Manage Users', path: '/users', icon: Package },
  { label: 'Warehouse Layout', path: '/warehouse/zones', icon: Warehouse },
];

// Helper function to format month name (e.g., "Jan 2024" -> "Jan")
const formatMonthName = (monthString) => {
  if (!monthString) return '';
  // Extract first 3 characters (month abbreviation)
  return monthString.split(' ')[0];
};

// Helper function to calculate trend percentage
const calculateTrend = (current, previous) => {
  if (!previous || previous === 0) return null;
  const percentChange = ((current - previous) / previous) * 100;
  return {
    value: `${Math.abs(percentChange).toFixed(0)}% from last month`,
    isPositive: percentChange >= 0,
  };
};

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState({
    totalShipments: 0,
    aiMismatches: 0,
    totalSKUs: 0,
    activeUsers: 0,
  });
  const [trends, setTrends] = useState({
    shipments: null,
    mismatches: null,
    skus: null,
  });
  const [stockReports, setStockReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      const analytics = await getAnalytics();

      // Set metrics from API response
      setMetrics({
        totalShipments: analytics.totalShipments || 0,
        aiMismatches: analytics.totalMismatches || 0,
        totalSKUs: analytics.totalSkus || 0,
        activeUsers: analytics.totalUsers || 0,
      });

      // Transform shipment trends for charts
      if (analytics.shipmentTrends && analytics.shipmentTrends.length > 0) {
        const transformedData = analytics.shipmentTrends.map((trend) => ({
          month: formatMonthName(trend.month),
          inbound: trend.inbound || 0,
          outbound: trend.outbound || 0,
          variance: (trend.inbound || 0) - (trend.outbound || 0),
        }));
        setStockReports(transformedData);

        // Calculate trends from shipment data
        if (transformedData.length >= 2) {
          const currentMonth = transformedData[transformedData.length - 1];
          const previousMonth = transformedData[transformedData.length - 2];
          
          const currentShipments = currentMonth.inbound + currentMonth.outbound;
          const previousShipments = previousMonth.inbound + previousMonth.outbound;
          
          setTrends({
            shipments: calculateTrend(currentShipments, previousShipments),
            mismatches: null, // Mismatches trend would need historical data from backend
            skus: null, // SKUs trend would need historical data from backend
          });
        }
      } else {
        setStockReports([]);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try again later.');
      // Set empty data on error for graceful degradation
      setStockReports([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading text="Loading dashboard..." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-500">Welcome back! Here's what's happening in your warehouse.</p>
      </div>

      {error && (
        <Alert variant="error" onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Shipments"
          value={metrics.totalShipments}
          icon={Package}
          trend={trends.shipments}
          iconBgColor="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatsCard
          title="AI Mismatches"
          value={metrics.aiMismatches}
          icon={AlertTriangle}
          trend={trends.mismatches}
          iconBgColor="bg-orange-50"
          iconColor="text-orange-600"
        />
        <StatsCard
          title="Total SKUs"
          value={metrics.totalSKUs.toLocaleString()}
          icon={Warehouse}
          trend={trends.skus}
          iconBgColor="bg-green-50"
          iconColor="text-green-600"
        />
        <StatsCard
          title="Active Users"
          value={metrics.activeUsers}
          icon={TrendingUp}
          iconBgColor="bg-purple-50"
          iconColor="text-purple-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Stock Movement</CardTitle>
          </CardHeader>
          <CardContent>
            {stockReports.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stockReports}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="inbound" fill="#3b82f6" name="Inbound" />
                  <Bar dataKey="outbound" fill="#10b981" name="Outbound" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Inventory Variance</CardTitle>
          </CardHeader>
          <CardContent>
            {stockReports.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stockReports}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="variance" stroke="#f59e0b" strokeWidth={2} name="Variance" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                No data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Links</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link key={link.path} to={link.path}>
                  <Button variant="outline" className="w-full h-24 flex flex-col gap-2">
                    <Icon className="w-6 h-6" />
                    <span>{link.label}</span>
                  </Button>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <FloatingChatButton />
    </div>
  );
}
