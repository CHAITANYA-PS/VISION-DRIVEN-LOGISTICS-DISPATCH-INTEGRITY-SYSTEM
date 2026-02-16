import { useState, useEffect } from 'react';
import { PackageSearch, Truck, MapPin, CheckCircle } from 'lucide-react';
import { StatsCard } from '../../components/shared/StatsCard';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';
import Alert from '../../components/common/Alert';
import { Link } from 'react-router-dom';
import { getWorkerDashboardMetrics } from '../../services/dashboardService';
import { getUserId } from '../../services/authService';

export default function WorkerDashboard() {
  const [metrics, setMetrics] = useState({
    pendingInbound: 0,
    pendingOutbound: 0,
    pendingPutaway: 0,
    completedToday: 0,
  });
  const [inboundTasks, setInboundTasks] = useState([]);
  const [outboundTasks, setOutboundTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const userId = getUserId();
      if (!userId) {
        setError('User ID not found. Please log in again.');
        setLoading(false);
        return;
      }

      const userIdNum = parseInt(userId, 10);
      if (isNaN(userIdNum)) {
        setError('Invalid user ID. Please log in again.');
        setLoading(false);
        return;
      }

      const data = await getWorkerDashboardMetrics(userIdNum);
      
      // Check if we got valid data (the function always returns data, even on error)
      if (data && data.metrics) {
        setMetrics(data.metrics);
        setInboundTasks(data.inboundTasks || []);
        setOutboundTasks(data.outboundTasks || []);
      } else {
        // If data structure is invalid, set defaults
        setMetrics({
          pendingInbound: 0,
          pendingOutbound: 0,
          pendingPutaway: 0,
          completedToday: 0,
        });
        setInboundTasks([]);
        setOutboundTasks([]);
        console.warn('Received invalid data structure from dashboard service');
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      // Only show error if it's a network/auth error, not if it's just empty data
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError('Authentication error. Please log in again.');
      } else if (err.message && !err.message.includes('Network')) {
        // Don't show error for network issues if we have fallback data
        setError('Failed to load dashboard data. Please try again.');
      }
      // Set defaults on error
      setMetrics({
        pendingInbound: 0,
        pendingOutbound: 0,
        pendingPutaway: 0,
        completedToday: 0,
      });
      setInboundTasks([]);
      setOutboundTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'High':
        return <Badge variant="destructive">{priority}</Badge>;
      case 'Medium':
        return <Badge className="bg-yellow-100 text-yellow-800">{priority}</Badge>;
      case 'Low':
        return <Badge className="bg-green-100 text-green-800">{priority}</Badge>;
      default:
        return <Badge>{priority}</Badge>;
    }
  };

  if (loading) {
    return <Loading text="Loading dashboard..." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-gray-900 mb-2">Worker Dashboard</h1>
        <p className="text-gray-500">Your tasks and activities</p>
      </div>

      {error && (
        <Alert variant="error" onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Pending Inbound"
          value={metrics.pendingInbound}
          icon={PackageSearch}
          iconBgColor="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatsCard
          title="Pending Outbound"
          value={metrics.pendingOutbound}
          icon={Truck}
          iconBgColor="bg-purple-50"
          iconColor="text-purple-600"
        />
        <StatsCard
          title="Pending Putaway"
          value={metrics.pendingPutaway}
          icon={MapPin}
          iconBgColor="bg-green-50"
          iconColor="text-green-600"
        />
        <StatsCard
          title="Completed Today"
          value={metrics.completedToday}
          icon={CheckCircle}
          iconBgColor="bg-emerald-50"
          iconColor="text-emerald-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Inbound Tasks</CardTitle>
              <Link to="/worker/inbound">
                <Button variant="outline" size="sm">View All</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {inboundTasks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <PackageSearch size={48} className="mx-auto mb-4 text-gray-400" />
                <p>No inbound tasks available</p>
              </div>
            ) : (
              <div className="space-y-3">
                {inboundTasks.map((task) => (
                  <div key={task.id} className="p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">{task.shipmentId}</span>
                      {getPriorityBadge(task.priority)}
                    </div>
                    <p className="text-gray-600 text-sm">{task.vendor}</p>
                    <p className="text-gray-500 text-sm">
                      {task.items} items • Expected: {task.expectedTime}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Outbound Tasks</CardTitle>
              <Link to="/worker/picking">
                <Button variant="outline" size="sm">View All</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {outboundTasks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Truck size={48} className="mx-auto mb-4 text-gray-400" />
                <p>No outbound tasks available</p>
              </div>
            ) : (
              <div className="space-y-3">
                {outboundTasks.map((task) => (
                  <div key={task.id} className="p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">{task.orderId}</span>
                      {getPriorityBadge(task.priority)}
                    </div>
                    <p className="text-gray-600 text-sm">{task.customer}</p>
                    <p className="text-gray-500 text-sm">
                      {task.items} items • Deadline: {task.deadline}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
