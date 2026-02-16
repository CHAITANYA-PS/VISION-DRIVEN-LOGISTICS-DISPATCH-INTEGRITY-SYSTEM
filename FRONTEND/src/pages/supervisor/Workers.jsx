import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Search, Eye, Edit, Trash2, Package, ClipboardList } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';
import Table, { TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/common/Table';
import Loading from '../../components/common/Loading';
import Alert from '../../components/common/Alert';
import Modal from '../../components/common/Modal';
import { getWorkers, deleteUser, updateUser, getUserById } from '../../services/userService';
import { getTasksByUser } from '../../services/taskService';
import { getAllShipments } from '../../services/shipmentService';
import { isAdmin } from '../../services/authService';
import { getStatusColor } from '../../utils/helpers';
import { formatDateTime } from '../../utils/formatters';

export default function Workers() {
  const navigate = useNavigate();
  const [workers, setWorkers] = useState([]);
  const [workerTasks, setWorkerTasks] = useState({});
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [info, setInfo] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [taskFetchErrors, setTaskFetchErrors] = useState({});
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [workerToDelete, setWorkerToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [workerToPreview, setWorkerToPreview] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [workerToEdit, setWorkerToEdit] = useState(null);
  const [editFormData, setEditFormData] = useState({ name: '', email: '' });
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editFormErrors, setEditFormErrors] = useState({});

  useEffect(() => {
    fetchWorkers();
  }, []);

  const fetchWorkers = async () => {
    try {
      setLoading(true);
      setError('');

      // Use getWorkers() for both ADMIN and SUPERVISOR (works for both roles)
      // Fetch all required data in parallel, but handle errors gracefully
      const [workersResult, shipmentsResult] = await Promise.allSettled([
        getWorkers(), // Works for both ADMIN and SUPERVISOR
        getAllShipments(),
      ]);

      // Extract successful results, defaulting to empty arrays on failure
      let workers = workersResult.status === 'fulfilled' ? workersResult.value : [];
      const shipmentsData = shipmentsResult.status === 'fulfilled' ? shipmentsResult.value : [];
      
      // Store shipments for later use in counting active shipments
      setShipments(shipmentsData);

      // Log errors for failures
      if (workersResult.status === 'rejected') {
        console.error('Error fetching workers:', workersResult.reason);
      }
      if (shipmentsResult.status === 'rejected') {
        console.error('Error fetching shipments:', shipmentsResult.reason);
      }

      // Optional: Supplement workers from shipments if needed
      // This ensures we get workers even if API response is incomplete
      const workerMap = new Map();

      // Add workers from API response
      workers.forEach((worker) => {
        workerMap.set(worker.id, worker);
      });

      // Add workers from shipments as supplement (if any are missing from API)
      if (shipmentsData.length > 0) {
        shipmentsData.forEach((shipment) => {
          if (shipment.assignedWorkers && Array.isArray(shipment.assignedWorkers)) {
            shipment.assignedWorkers.forEach((worker) => {
              if (worker.role === 'WORKER' && !workerMap.has(worker.id)) {
                workerMap.set(worker.id, worker);
              }
            });
          }
        });
      }

      // Convert map to array
      const allWorkers = Array.from(workerMap.values());

      // Show error if no workers found from any source
      if (allWorkers.length === 0) {
        setError('Failed to load workers. No workers found in the system.');
      } else {
        setWorkers(allWorkers);
        setError(''); // Clear any previous errors
      }

      // Fetch tasks for each worker
      const taskErrors = {};
      const tasksPromises = allWorkers.map(async (worker) => {
        try {
          const tasks = await getTasksByUser(worker.id);
          console.log(`Fetched tasks for worker ${worker.id} (${worker.name}):`, {
            workerId: worker.id,
            workerName: worker.name,
            tasksCount: tasks?.length || 0,
            tasks: tasks,
            activeTasks: tasks?.filter(t => t.status && t.status !== 'COMPLETED').length || 0
          });
          
          // Clear any previous error for this worker
          if (taskErrors[worker.id]) {
            delete taskErrors[worker.id];
          }
          
          return { workerId: worker.id, tasks: tasks || [] };
        } catch (err) {
          const errorMessage = err.response?.data?.message || 
                              err.response?.data?.error || 
                              err.message || 
                              'Failed to fetch tasks';
          const errorStatus = err.response?.status;
          
          console.error(`Error fetching tasks for worker ${worker.id} (${worker.name}):`, {
            error: err,
            message: errorMessage,
            response: err.response?.data,
            status: errorStatus
          });
          
          // Store error for this worker
          taskErrors[worker.id] = {
            message: errorMessage,
            status: errorStatus
          };
          
          return { workerId: worker.id, tasks: [] };
        }
      });

      const tasksResults = await Promise.all(tasksPromises);
      const tasksMap = {};
      tasksResults.forEach(({ workerId, tasks }) => {
        tasksMap[workerId] = tasks;
      });
      
      // Set task fetch errors if any
      if (Object.keys(taskErrors).length > 0) {
        setTaskFetchErrors(taskErrors);
        console.warn('Some workers had task fetch errors:', taskErrors);
      } else {
        setTaskFetchErrors({});
      }
      
      // Debug: Log final tasks map
      console.log('Final worker tasks map:', tasksMap);
      console.log('Total workers:', allWorkers.length);
      console.log('Workers with tasks:', Object.keys(tasksMap).filter(id => tasksMap[id].length > 0).length);
      setWorkerTasks(tasksMap);
    } catch (err) {
      console.error('Unexpected error fetching workers:', err);
      setError('Failed to load workers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredWorkers = workers.filter(worker =>
    worker.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    worker.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getActiveTasksCount = (workerId) => {
    // Count active tasks (not COMPLETED)
    const tasks = workerTasks[workerId] || [];
    const activeTasksCount = tasks.filter(t => {
      if (!t || !t.status) return false;
      const status = String(t.status).toUpperCase();
      return status !== 'COMPLETED';
    }).length;
    
    // Count active shipments assigned to this worker (not COMPLETED)
    const activeShipmentsCount = shipments.filter(shipment => {
      if (!shipment || !shipment.status) return false;
      const status = String(shipment.status).toUpperCase();
      if (status === 'COMPLETED') return false;
      
      // Check if this worker is assigned to this shipment
      if (shipment.assignedWorkers && Array.isArray(shipment.assignedWorkers)) {
        return shipment.assignedWorkers.some(worker => 
          worker.id === workerId && worker.role === 'WORKER'
        );
      }
      return false;
    }).length;
    
    // Total active items = active tasks + active shipments
    const totalActive = activeTasksCount + activeShipmentsCount;
    
    // Debug logging for specific worker if needed
    if (tasks.length > 0 || activeShipmentsCount > 0) {
      console.log(`Worker ${workerId} active items:`, {
        activeTasks: activeTasksCount,
        activeShipments: activeShipmentsCount,
        totalActive: totalActive,
        tasks: tasks.map(t => ({ 
          id: t.id, 
          status: t.status, 
          taskType: t.taskType,
          userId: t.userId 
        }))
      });
    }
    
    return totalActive;
  };

  const handlePreview = (worker) => {
    // Show preview modal with worker details
    setWorkerToPreview(worker);
    setPreviewModalOpen(true);
  };

  const handleEdit = async (worker) => {
    try {
      // Fetch full worker details
      const workerDetails = await getUserById(worker.id);
      setWorkerToEdit(workerDetails);
      setEditFormData({
        name: workerDetails.name || '',
        email: workerDetails.email || '',
      });
      setEditFormErrors({});
      setError('');
      setEditModalOpen(true);
    } catch (err) {
      const errorMessage = err.response?.data?.error || 
                          err.response?.data?.message || 
                          err.message || 
                          'Failed to load worker details';
      setError(errorMessage);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditFormErrors({});
    setError('');

    // Validate form
    const errors = {};
    if (!editFormData.name.trim()) {
      errors.name = 'Name is required';
    }
    if (!editFormData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editFormData.email)) {
      errors.email = 'Invalid email address';
    }

    if (Object.keys(errors).length > 0) {
      setEditFormErrors(errors);
      return;
    }

    setEditSubmitting(true);

    try {
      const payload = {
        name: editFormData.name.trim(),
        email: editFormData.email.trim(),
      };

      // Only admins can change roles, so only include role if user is admin
      if (isAdmin()) {
        payload.role = workerToEdit.role; // Keep the same role
      }

      await updateUser(workerToEdit.id, payload);
      setSuccess(`Worker "${editFormData.name}" updated successfully`);
      setEditModalOpen(false);
      setWorkerToEdit(null);
      setEditFormData({ name: '', email: '' });
      
      // Refresh the workers list
      await fetchWorkers();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      const errorMessage = err.response?.data?.error || 
                          err.response?.data?.message || 
                          err.message || 
                          'Failed to update worker';
      setError(errorMessage);
      console.error('Error updating worker:', err);
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDelete = (worker) => {
    // Show delete confirmation modal
    setWorkerToDelete(worker);
    setDeleteModalOpen(true);
    setError('');
  };

  const handleDeleteConfirm = async () => {
    if (!workerToDelete) return;

    setDeleting(true);
    setError('');

    try {
      await deleteUser(workerToDelete.id);
      setSuccess(`Worker "${workerToDelete.name}" deleted successfully`);
      setDeleteModalOpen(false);
      setWorkerToDelete(null);
      
      // Refresh the workers list
      await fetchWorkers();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      const errorMessage = err.response?.data?.error || 
                          err.response?.data?.message || 
                          err.message || 
                          'Failed to delete worker';
      setError(errorMessage);
      console.error('Error deleting worker:', err);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <Loading text="Loading workers..." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Worker Management</h1>
        <p className="text-gray-600 mt-1">Monitor worker performance and activity</p>
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

      {info && (
        <Alert variant="warning" onClose={() => setInfo('')}>
          {info}
        </Alert>
      )}

      <Card>
        <div className="flex items-center gap-4 p-4">
          <div className="flex-1">
            <Input
              placeholder="Search workers by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          <Button variant="outline">
            <Search size={20} className="mr-2" />
            Search
          </Button>
        </div>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Worker ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Active Tasks</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredWorkers.map((worker) => {
              const activeTasks = getActiveTasksCount(worker.id);
              return (
                <TableRow key={worker.id}>
                  <TableCell className="font-medium">#{worker.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Users size={16} className="text-gray-400" />
                      {worker.name}
                    </div>
                  </TableCell>
                  <TableCell>{worker.email}</TableCell>
                  <TableCell>
                    {taskFetchErrors[worker.id] ? (
                      <Badge variant="red" title={`Error: ${taskFetchErrors[worker.id].message}`}>
                        Error
                      </Badge>
                    ) : (
                      <Badge variant={activeTasks > 0 ? 'orange' : 'green'}>
                        {activeTasks} active
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="green">Active</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePreview(worker)}
                        title="Preview"
                      >
                        <Eye size={16} />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(worker)}
                        title="Edit"
                      >
                        <Edit size={16} />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(worker)}
                        title="Delete"
                        className="text-red-600 hover:text-red-700 hover:border-red-300"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {filteredWorkers.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No workers found
          </div>
        )}
      </Card>

      {/* Preview Modal */}
      <Modal
        isOpen={previewModalOpen}
        onClose={() => {
          setPreviewModalOpen(false);
          setWorkerToPreview(null);
        }}
        title="Worker Details"
        size="lg"
      >
        {workerToPreview && (() => {
          const workerId = workerToPreview.id;
          const workerTasksList = workerTasks[workerId] || [];
          const activeTasks = workerTasksList.filter(t => {
            if (!t || !t.status) return false;
            return String(t.status).toUpperCase() !== 'COMPLETED';
          });
          
          const assignedShipments = shipments.filter(shipment => {
            if (!shipment || !shipment.status) return false;
            if (shipment.assignedWorkers && Array.isArray(shipment.assignedWorkers)) {
              return shipment.assignedWorkers.some(worker => 
                worker.id === workerId && worker.role === 'WORKER'
              );
            }
            return false;
          });
          
          const activeShipments = assignedShipments.filter(shipment => {
            const status = String(shipment.status).toUpperCase();
            return status !== 'COMPLETED';
          });

          return (
            <div className="space-y-6">
              {/* Worker Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Worker ID</label>
                  <p className="text-gray-900 font-semibold">#{workerToPreview.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <p className="text-gray-900">
                    <Badge variant="green">Active</Badge>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Name</label>
                  <p className="text-gray-900">{workerToPreview.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="text-gray-900">{workerToPreview.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Role</label>
                  <p className="text-gray-900">{workerToPreview.role}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Active Tasks</label>
                  <p className="text-gray-900">
                    <Badge variant={getActiveTasksCount(workerId) > 0 ? 'orange' : 'green'}>
                      {getActiveTasksCount(workerId)} active
                    </Badge>
                  </p>
                </div>
              </div>

              {/* Active Tasks Section */}
              {activeTasks.length > 0 && (
                <div className="border-t pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <ClipboardList size={18} className="text-gray-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Active Tasks ({activeTasks.length})</h3>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {activeTasks.map((task) => (
                      <div key={task.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium text-gray-900">Task #{task.id}</span>
                              <Badge variant={getStatusColor(task.status)}>
                                {task.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Type:</span> {task.taskType || 'N/A'}
                            </p>
                            {task.shipmentItemId && (
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">Shipment Item ID:</span> #{task.shipmentItemId}
                              </p>
                            )}
                            {task.createdAt && (
                              <p className="text-xs text-gray-500 mt-1">
                                Created: {formatDateTime(task.createdAt)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Active Shipments Section */}
              {activeShipments.length > 0 && (
                <div className="border-t pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Package size={18} className="text-gray-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Active Shipments ({activeShipments.length})</h3>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {activeShipments.map((shipment) => (
                      <div key={shipment.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium text-gray-900">Shipment SH-{shipment.id}</span>
                              <Badge variant={shipment.shipmentType === 'INBOUND' ? 'blue' : 'purple'}>
                                {shipment.shipmentType}
                              </Badge>
                              <Badge variant={getStatusColor(shipment.status)}>
                                {shipment.status}
                              </Badge>
                            </div>
                            {shipment.packageCount !== undefined && (
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">Packages:</span> {shipment.packageCount || 0}
                              </p>
                            )}
                            {shipment.deadline && (
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">Deadline:</span> {formatDateTime(shipment.deadline)}
                              </p>
                            )}
                            {shipment.createdAt && (
                              <p className="text-xs text-gray-500 mt-1">
                                Created: {formatDateTime(shipment.createdAt)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No active tasks or shipments message */}
              {activeTasks.length === 0 && activeShipments.length === 0 && (
                <div className="border-t pt-4">
                  <p className="text-sm text-gray-500 text-center py-4">
                    No active tasks or shipments assigned to this worker.
                  </p>
                </div>
              )}

              <div className="flex justify-end pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setPreviewModalOpen(false);
                    setWorkerToPreview(null);
                  }}
                >
                  Close
                </Button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => {
          if (!editSubmitting) {
            setEditModalOpen(false);
            setWorkerToEdit(null);
            setEditFormData({ name: '', email: '' });
            setEditFormErrors({});
            setError('');
          }
        }}
        title="Edit Worker"
        size="md"
      >
        {workerToEdit && (
          <form onSubmit={handleEditSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Worker ID
                </label>
                <p className="text-gray-900 font-semibold">#{workerToEdit.id}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => {
                    setEditFormData({ ...editFormData, name: e.target.value });
                    setEditFormErrors({ ...editFormErrors, name: '' });
                  }}
                  className={editFormErrors.name ? 'border-red-500' : ''}
                  placeholder="Worker name"
                />
                {editFormErrors.name && (
                  <p className="text-sm text-red-600 mt-1">{editFormErrors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <Input
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => {
                    setEditFormData({ ...editFormData, email: e.target.value });
                    setEditFormErrors({ ...editFormErrors, email: '' });
                  }}
                  className={editFormErrors.email ? 'border-red-500' : ''}
                  placeholder="worker@example.com"
                />
                {editFormErrors.email && (
                  <p className="text-sm text-red-600 mt-1">{editFormErrors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <p className="text-gray-900">{workerToEdit.role}</p>
                <p className="text-xs text-gray-500 mt-1">Role cannot be changed</p>
              </div>

              {error && (
                <Alert variant="error" onClose={() => setError('')}>
                  {error}
                </Alert>
              )}

              <div className="flex gap-3 justify-end pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditModalOpen(false);
                    setWorkerToEdit(null);
                    setEditFormData({ name: '', email: '' });
                    setEditFormErrors({});
                    setError('');
                  }}
                  disabled={editSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={editSubmitting}
                >
                  {editSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          if (!deleting) {
            setDeleteModalOpen(false);
            setWorkerToDelete(null);
            setError('');
          }
        }}
        title="Delete Worker"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete worker <strong>{workerToDelete?.name}</strong> (ID: #{workerToDelete?.id})?
            This action cannot be undone.
          </p>
          <p className="text-sm text-red-600">
            This will permanently remove the worker from the system. All associated data will be lost.
          </p>
          {error && (
            <Alert variant="error" onClose={() => setError('')}>
              {error}
            </Alert>
          )}
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteModalOpen(false);
                setWorkerToDelete(null);
                setError('');
              }}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

