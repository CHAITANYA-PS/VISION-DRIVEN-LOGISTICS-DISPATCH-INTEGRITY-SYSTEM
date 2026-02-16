import { useState, useEffect } from 'react';
import { Plus, Package } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Badge from '../../components/common/Badge';
import Table, { TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import Loading from '../../components/common/Loading';
import Alert from '../../components/common/Alert';
import { getRacksByZone, createRack } from '../../services/rackService';
import { getAllZones } from '../../services/zoneService';
import { getRole } from '../../services/authService';

export default function Racks() {
  const [racks, setRacks] = useState([]);
  const [zones, setZones] = useState([]);
  const [selectedZone, setSelectedZone] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingZones, setLoadingZones] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ zoneId: '', name: '', description: '' });
  const [submitting, setSubmitting] = useState(false);
  const role = getRole();
  const canManage = role === 'ADMIN' || role === 'SUPERVISOR';

  useEffect(() => {
    fetchZones();
  }, []);

  useEffect(() => {
    if (selectedZone) {
      fetchRacks();
    } else {
      setRacks([]);
    }
  }, [selectedZone]);

  const fetchZones = async () => {
    try {
      const data = await getAllZones();
      setZones(data);
      if (data.length > 0) {
        setSelectedZone(data[0].id.toString());
      }
    } catch (err) {
      setError('Failed to load zones');
    } finally {
      setLoadingZones(false);
    }
  };

  const fetchRacks = async () => {
    setLoading(true);
    try {
      const data = await getRacksByZone(parseInt(selectedZone));
      setRacks(data);
    } catch (err) {
      setError('Failed to load racks');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createRack({
        ...formData,
        zoneId: parseInt(formData.zoneId),
      });
      setIsModalOpen(false);
      setFormData({ zoneId: selectedZone, name: '', description: '' });
      fetchRacks();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create rack');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingZones) return <Loading text="Loading zones..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Racks</h1>
          <p className="text-gray-600 mt-1">Manage racks within zones</p>
        </div>
        {canManage && (
          <Button variant="primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={20} className="mr-2" />
            Add Rack
          </Button>
        )}
      </div>

      {error && (
        <Alert variant="error" onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Card>
        <div className="p-4 border-b border-gray-200">
          <Select
            label="Select Zone"
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            options={[
              { value: '', label: 'Select a zone' },
              ...zones.map((z) => ({ value: z.id.toString(), label: z.name })),
            ]}
          />
        </div>
      </Card>

      {selectedZone && (
        <Card>
          {loading ? (
            <Loading text="Loading racks..." />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rack ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {racks.map((rack) => (
                    <TableRow key={rack.id}>
                      <TableCell className="font-medium">#{rack.id}</TableCell>
                      <TableCell>{rack.name}</TableCell>
                      <TableCell>{rack.description || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="green">Active</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {racks.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Package size={48} className="mx-auto mb-4 text-gray-400" />
                  <p>No racks found in this zone</p>
                </div>
              )}
            </>
          )}
        </Card>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Rack"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Select
            label="Zone"
            name="zoneId"
            value={formData.zoneId || selectedZone}
            onChange={(e) => setFormData({ ...formData, zoneId: e.target.value })}
            required
            options={[
              { value: '', label: 'Select a zone' },
              ...zones.map((z) => ({ value: z.id.toString(), label: z.name })),
            ]}
          />
          <Input
            label="Rack Name"
            name="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            placeholder="e.g., Rack 1, Rack 2"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Rack description"
            />
          </div>
          <div className="flex gap-4">
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Rack'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
