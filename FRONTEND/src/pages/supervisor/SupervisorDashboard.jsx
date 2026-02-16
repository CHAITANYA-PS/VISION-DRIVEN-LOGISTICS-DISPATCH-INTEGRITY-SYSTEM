import { useState, useEffect } from 'react';
import { Truck, AlertTriangle, Users, CheckCircle } from 'lucide-react';
import { StatsCard } from '../../components/shared/StatsCard';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';
import Alert from '../../components/common/Alert';
import { Link } from 'react-router-dom';
import { getSupervisorDashboardMetrics } from '../../services/dashboardService';
import FloatingChatButton from '../../components/features/chat/FloatingChatButton';

export default function SupervisorDashboard() {
  const [metrics, setMetrics] = useState({
    activeShipments: 0,
    pendingApprovals: 0,
    activeWorkers: 0,
    completedToday: 0,
  });
  const [pendingMismatches, setPendingMismatches] = useState([]);
  const [workerTaskOverview, setWorkerTaskOverview] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getSupervisorDashboardMetrics();
      setMetrics(data.metrics);
      setPendingMismatches(data.pendingMismatches);
      setWorkerTaskOverview(data.workerTaskOverview);
      
      // Show warning if some data might be missing (e.g., worker info if user doesn't have permission)
      if (data.metrics.activeWorkers === 0 && data.workerTaskOverview.length === 0) {
        // This is expected for supervisors who can't access user list
        // Don't show error, just log for debugging
        console.info('Worker information may be limited. Some metrics may show zero values.');
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loading text="Loading dashboard..." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-gray-900 mb-2">Supervisor Dashboard</h1>
        <p className="text-gray-500">Monitor operations and manage approvals</p>
      </div>

      {error && (
        <Alert variant="error" onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Active Shipments"
          value={metrics.activeShipments}
          icon={Truck}
          iconBgColor="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatsCard
          title="Pending Approvals"
          value={metrics.pendingApprovals}
          icon={AlertTriangle}
          iconBgColor="bg-orange-50"
          iconColor="text-orange-600"
        />
        <StatsCard
          title="Active Workers"
          value={metrics.activeWorkers}
          icon={Users}
          iconBgColor="bg-green-50"
          iconColor="text-green-600"
        />
        <StatsCard
          title="Tasks Completed Today"
          value={metrics.completedToday}
          icon={CheckCircle}
          iconBgColor="bg-purple-50"
          iconColor="text-purple-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>AI Mismatch Alerts</CardTitle>
              <Link to="/supervisor/approvals">
                <Button variant="outline" size="sm">View All</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {pendingMismatches.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle size={48} className="mx-auto mb-4 text-green-500" />
                <p>No pending mismatch alerts</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingMismatches.map((mismatch) => (
                  <div key={mismatch.id} className="p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-900">{mismatch.id}</span>
                      <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                        Pending
                      </Badge>
                    </div>
                    <p className="text-gray-600">
                      Predicted: {mismatch.predictedSku} → Scanned: {mismatch.scannedSku}
                    </p>
                    <p className="text-gray-500">
                      Worker: {mismatch.worker} • Confidence: {mismatch.confidence}%
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Worker Task Overview</CardTitle>
          </CardHeader>
          <CardContent>
            {workerTaskOverview.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users size={48} className="mx-auto mb-4 text-gray-400" />
                <p>No active worker tasks</p>
              </div>
            ) : (
              <div className="space-y-4">
                {workerTaskOverview.map((task, i) => (
                  <div key={`${task.workerId}-${task.taskId || task.shipmentId || i}`} className="p-4 border border-gray-200 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">{task.workerName}</span>
                      <Badge variant={
                        task.status === 'In Progress' ? 'yellow' : 
                        task.status === 'Pending' ? 'blue' :
                        task.status === 'Assigned' ? 'gray' : 'green'
                      }>
                        {task.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      {task.shipmentId ? (
                        <>
                          <p>Shipment: #SH-{task.shipmentId}</p>
                          {task.taskType !== 'ASSIGNED' && (
                            <p>Task: {task.taskType}</p>
                          )}
                          {task.itemsTotal > 0 && (
                            <p>Packages: {task.itemsTotal}</p>
                          )}
                        </>
                      ) : task.shipmentItemId ? (
                        <>
                          <p>Task: {task.taskType} - Shipment Item: #{task.shipmentItemId}</p>
                          {task.itemsTotal > 0 ? (
                            <p>Items: {task.itemsCompleted} / {task.itemsTotal}</p>
                          ) : null}
                        </>
                      ) : (
                        <p>Status: {task.status}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <FloatingChatButton />
    </div>
  );
}
