import { Box, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import Alert from "../../components/common/Alert";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import Input from "../../components/common/Input";
import Loading from "../../components/common/Loading";
import Modal from "../../components/common/Modal";
import Select from "../../components/common/Select";
import Table, {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/common/Table";
import { getRole } from "../../services/authService";
import { createBin, getBinsByRack } from "../../services/binService";
import { getRacksByZone } from "../../services/rackService";
import { getAllZones } from "../../services/zoneService";

export default function Bins() {
  const [bins, setBins] = useState([]);
  const [zones, setZones] = useState([]);
  const [racks, setRacks] = useState([]);
  const [selectedZone, setSelectedZone] = useState("");
  const [selectedRack, setSelectedRack] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingZones, setLoadingZones] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    rackId: "",
    name: "",
    capacity: 100,
  });
  const [submitting, setSubmitting] = useState(false);
  const role = getRole();
  const canManage = role === "ADMIN" || role === "SUPERVISOR";

  useEffect(() => {
    fetchZones();
  }, []);

  useEffect(() => {
    if (selectedZone) {
      fetchRacks();
    } else {
      setRacks([]);
      setSelectedRack("");
    }
  }, [selectedZone]);

  useEffect(() => {
    if (selectedRack) {
      fetchBins();
    } else {
      setBins([]);
    }
  }, [selectedRack]);

  const fetchZones = async () => {
    try {
      const data = await getAllZones();
      setZones(data);
      if (data.length > 0) {
        setSelectedZone(data[0].id.toString());
      }
    } catch (err) {
      setError("Failed to load zones");
    } finally {
      setLoadingZones(false);
    }
  };

  const fetchRacks = async () => {
    try {
      const data = await getRacksByZone(parseInt(selectedZone));
      setRacks(data);
      if (data.length > 0) {
        setSelectedRack(data[0].id.toString());
      }
    } catch (err) {
      setError("Failed to load racks");
    }
  };

  const fetchBins = async () => {
    setLoading(true);
    try {
      const data = await getBinsByRack(parseInt(selectedRack));
      setBins(data);
    } catch (err) {
      setError("Failed to load bins");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createBin({
        ...formData,
        rackId: parseInt(formData.rackId),
      });
      setIsModalOpen(false);
      setFormData({ rackId: selectedRack, name: "", capacity: 100 });
      fetchBins();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create bin");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingZones) return <Loading text="Loading zones..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bins</h1>
          <p className="text-gray-600 mt-1">Manage bins within racks</p>
        </div>
        {canManage && (
          <Button variant="primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={20} className="mr-2" />
            Add Bin
          </Button>
        )}
      </div>

      {error && (
        <Alert variant="error" onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      <Card>
        <div className="p-4 space-y-4">
          <Select
            label="Select Zone"
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            options={[
              { value: "", label: "Select a zone" },
              ...zones.map((z) => ({ value: z.id.toString(), label: z.name })),
            ]}
          />
          {selectedZone && (
            <Select
              label="Select Rack"
              value={selectedRack}
              onChange={(e) => setSelectedRack(e.target.value)}
              options={[
                { value: "", label: "Select a rack" },
                ...racks.map((r) => ({
                  value: r.id.toString(),
                  label: r.name,
                })),
              ]}
            />
          )}
        </div>
      </Card>

      {selectedRack && (
        <Card>
          {loading ? (
            <Loading text="Loading bins..." />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bin ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Capacity</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bins.map((bin) => (
                    <TableRow key={bin.id}>
                      <TableCell className="font-medium">#{bin.id}</TableCell>
                      <TableCell>{bin.name}</TableCell>
                      <TableCell className="font-mono text-sm">{bin.code || "-"}</TableCell>
                      <TableCell>{bin.capacity || "-"}</TableCell>
                      <TableCell>
                        <Badge variant="green">Active</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {bins.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Box size={48} className="mx-auto mb-4 text-gray-400" />
                  <p>No bins found in this rack</p>
                </div>
              )}
            </>
          )}
        </Card>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Bin"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Select
            label="Rack"
            name="rackId"
            value={formData.rackId || selectedRack}
            onChange={(e) =>
              setFormData({ ...formData, rackId: e.target.value })
            }
            required
            options={[
              { value: "", label: "Select a rack" },
              ...racks.map((r) => ({ value: r.id.toString(), label: r.name })),
            ]}
          />
          <Input
            label="Bin Name"
            name="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            placeholder="e.g., Bin A1, Bin B2"
          />
          <Input
            label="Capacity"
            name="capacity"
            type="number"
            min="1"
            value={formData.capacity}
            onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
            required
            placeholder="Maximum quantity"
          />
          <div className="flex gap-4">
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? "Creating..." : "Create Bin"}
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
