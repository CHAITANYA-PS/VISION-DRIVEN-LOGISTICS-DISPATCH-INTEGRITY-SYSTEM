import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Eye, Edit, Trash2, Plus, Users } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';
import Table, { TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import Loading from '../../components/common/Loading';
import Alert from '../../components/common/Alert';
import { getAllShipments, deleteShipment } from '../../services/shipmentService';
import { formatDate } from '../../utils/formatters';
import { getStatusColor } from '../../utils/helpers';

export default function SupervisorShipments() {
  const navigate = useNavigate();
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [shipmentToDelete, setShipmentToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchShipments();
  }, []);

  const fetchShipments = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getAllShipments();
      setShipments(data);
    } catch (err) {
      console.error('Error fetching shipments:', err);
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.error || 
                          err.message || 
                          'Failed to load shipments data';
      setError(errorMessage === 'Access Denied' ? 'Access Denied: Failed to load shipment data' : errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (shipment) => {
    setShipmentToDelete(shipment);
    setDeleteModalOpen(true);
    setError('');
  };

  const handleDeleteConfirm = async () => {
    if (!shipmentToDelete) return;

    try {
      setDeleting(true);
      setError('');
      await deleteShipment(shipmentToDelete.id);
      setSuccess(`Shipment SH-${shipmentToDelete.id} deleted successfully`);
      setDeleteModalOpen(false);
      setShipmentToDelete(null);
      fetchShipments();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      const errorMessage = err.response?.data?.error || 
                          err.response?.data?.message || 
                          err.message || 
                          'Failed to delete shipment';
      setError(errorMessage);
      console.error('Error deleting shipment:', err);
    } finally {
      setDeleting(false);
    }
  };

  const filteredShipments = shipments.filter(shipment =>
    shipment.id?.toString().includes(searchTerm) ||
    shipment.shipmentType?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <Loading text="Loading shipments..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Shipment Management
          </h1>
          <p className="text-gray-600 mt-1">
            Track all inbound and outbound shipments
          </p>
        </div>
        <Button variant="primary" onClick={() => navigate("/shipments/create")}>
          <Plus size={20} className="mr-2" />
          Create Shipment
        </Button>
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

      {/* Search */}
      <Card>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search shipments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          <Button variant="outline">
            <Search size={20} className="mr-2" />
            Search
          </Button>
          <Button variant="outline">
            <Filter size={20} className="mr-2" />
            Filter
          </Button>
        </div>
      </Card>

      {/* Shipments Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Shipment ID</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Packages</TableHead>
              <TableHead>Assigned Worker(s)</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Deadline</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredShipments.map((shipment) => (
              <TableRow key={shipment.id}>
                <TableCell className="font-medium">SH-{shipment.id}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      shipment.shipmentType === "INBOUND" ? "blue" : "purple"
                    }
                  >
                    {shipment.shipmentType}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusColor(shipment.status)}>
                    {shipment.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="font-medium">{shipment.packageCount || 0}</span>
                </TableCell>
                <TableCell>
                  {shipment.assignedWorkers && shipment.assignedWorkers.length > 0 ? (
                    <div className="flex items-center gap-2">
                      <Users size={16} className="text-gray-500" />
                      <span className="font-medium">
                        {shipment.assignedWorkers.length} Worker{shipment.assignedWorkers.length !== 1 ? 's' : ''}
                      </span>
                      <div className="group relative">
                        <span className="text-gray-500 cursor-help">ℹ️</span>
                        <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-10">
                          {shipment.assignedWorkers.map((w) => w.name).join(', ')}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <span className="text-gray-500">Unassigned</span>
                  )}
                </TableCell>
                <TableCell>{formatDate(shipment.createdAt)}</TableCell>
                <TableCell>
                  {shipment.deadline ? (
                    <span className={new Date(shipment.deadline) < new Date() ? 'text-red-600 font-medium' : ''}>
                      {formatDate(shipment.deadline)}
                    </span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/shipments/${shipment.id}`)}
                      title="Preview"
                    >
                      <Eye size={16} className="mr-1" />
                      Preview
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/shipments/${shipment.id}/edit`)}
                      title="Edit"
                    >
                      <Edit size={16} className="mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteClick(shipment)}
                      title="Delete"
                      className="text-red-600 hover:text-red-700 hover:border-red-300"
                    >
                      <Trash2 size={16} className="mr-1" />
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {filteredShipments.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No shipments found
          </div>
        )}
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          if (!deleting) {
            setDeleteModalOpen(false);
            setShipmentToDelete(null);
            setError('');
          }
        }}
        title="Delete Shipment"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete shipment{" "}
            <strong>SH-{shipmentToDelete?.id}</strong> ({shipmentToDelete?.shipmentType})?
            This action cannot be undone.
          </p>
          <p className="text-sm text-red-600">
            This will also delete all associated packages and worker assignments.
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
                setShipmentToDelete(null);
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
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

