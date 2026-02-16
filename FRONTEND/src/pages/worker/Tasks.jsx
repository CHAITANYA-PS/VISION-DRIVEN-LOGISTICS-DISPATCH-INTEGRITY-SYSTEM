import { useState, useEffect } from 'react';
import { ClipboardList, CheckCircle, Clock, Play } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Select from '../../components/common/Select';
import Loading from '../../components/common/Loading';
import Alert from '../../components/common/Alert';
import { getTasksByUser, updateTaskStatus } from '../../services/taskService';
import { getUserId } from '../../services/authService';
import { formatDate, formatDateTime } from '../../utils/formatters';
import { getStatusColor } from '../../utils/helpers';

export default function Tasks() {
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

  const handleStartTask = async (taskId) => {
    try {
      await updateTaskStatus(taskId, 'IN_PROGRESS');
      fetchTasks();
    } catch (err) {
      setError('Failed to start task');
    }
  };

  const handleCompleteTask = async (taskId) => {
    try {
      await updateTaskStatus(taskId, 'COMPLETED');
      fetchTasks();
    } catch (err) {
      setError('Failed to complete task');
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
          <h1 className="text-2xl font-bold text-gray-900">My Tasks</h1>
          <p className="text-gray-600 mt-1">View and manage your assigned tasks</p>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTasks.length === 0 ? (
          <div className="col-span-full">
            <Card>
              <div className="text-center py-12">
                <ClipboardList size={48} className="mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500">No tasks found</p>
              </div>
            </Card>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <Card key={task.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Task #{task.id}</CardTitle>
                  <Badge variant={getStatusColor(task.status)}>
                    {task.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Badge variant={task.taskType === 'PUTAWAY' ? 'blue' : 'purple'}>
                    {task.taskType}
                  </Badge>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>Shipment Item: #{task.shipmentItemId}</p>
                  <p className="flex items-center gap-1">
                    <Clock size={14} />
                    {formatDateTime(task.createdAt)}
                  </p>
                </div>
                <div className="flex gap-2 pt-2">
                  {task.status === 'PENDING' && (
                    <Button
                      variant="primary"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleStartTask(task.id)}
                    >
                      <Play size={16} className="mr-1" />
                      Start
                    </Button>
                  )}
                  {task.status === 'IN_PROGRESS' && (
                    <Button
                      variant="primary"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleCompleteTask(task.id)}
                    >
                      <CheckCircle size={16} className="mr-1" />
                      Complete
                    </Button>
                  )}
                  {task.status === 'COMPLETED' && (
                    <div className="flex items-center gap-2 text-green-600 text-sm">
                      <CheckCircle size={16} />
                      Completed
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

