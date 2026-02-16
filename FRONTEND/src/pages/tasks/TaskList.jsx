import { useState, useEffect } from 'react';
import { ClipboardList, CheckCircle, Clock } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Select from '../../components/common/Select';
import Table, { TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/common/Table';
import Loading from '../../components/common/Loading';
import Alert from '../../components/common/Alert';
import { getTasksByUser } from '../../services/taskService';
import { getUserId } from '../../services/authService';
import { formatDate, formatDateTime } from '../../utils/formatters';
import { getStatusColor } from '../../utils/helpers';

export default function TaskList() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const userId = getUserId();
      if (!userId) {
        setError('User not authenticated');
        return;
      }
      const data = await getTasksByUser(parseInt(userId));
      setTasks(data);
    } catch (err) {
      setError('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (statusFilter === 'ALL') return true;
    return task.status === statusFilter;
  });

  if (loading) return <Loading text="Loading tasks..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-600 mt-1">View and manage your tasks</p>
        </div>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={[
            { value: 'ALL', label: 'All Tasks' },
            { value: 'PENDING', label: 'Pending' },
            { value: 'IN_PROGRESS', label: 'In Progress' },
            { value: 'COMPLETED', label: 'Completed' },
          ]}
        />
      </div>

      {error && (
        <Alert variant="error" onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Task ID</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Shipment Item</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTasks.map((task) => (
              <TableRow key={task.id}>
                <TableCell className="font-medium">#{task.id}</TableCell>
                <TableCell>
                  <Badge variant={task.taskType === 'PUTAWAY' ? 'blue' : 'purple'}>
                    {task.taskType}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusColor(task.status)}>
                    {task.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {task.shipmentItemId ? `Item #${task.shipmentItemId}` : '-'}
                </TableCell>
                <TableCell>{formatDate(task.createdAt)}</TableCell>
                <TableCell>
                  {task.status !== 'COMPLETED' && (
                    <Button size="sm" variant="primary">
                      Start
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {filteredTasks.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <ClipboardList size={48} className="mx-auto mb-4 text-gray-400" />
            <p>No tasks found</p>
          </div>
        )}
      </Card>
    </div>
  );
}
