import { ArrowLeft, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Alert from "../../components/common/Alert";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import Input from "../../components/common/Input";
import Loading from "../../components/common/Loading";
import MultiSelect from "../../components/common/MultiSelect";
import Select from "../../components/common/Select";
import PackageInputRow from "../../components/shipments/PackageInputRow";
import {
  createBatchItems,
  deleteShipmentItem,
  getItemsByShipment,
} from "../../services/shipmentItemService";
import {
  assignWorkers,
  getAllShipments,
  getAssignedWorkers,
  getShipmentById,
  removeWorker,
  updateShipment,
} from "../../services/shipmentService";
import { getAllSkus } from "../../services/skuService";
import { getWorkers } from "../../services/userService";

export default function ShipmentEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [workers, setWorkers] = useState([]);
  const [skus, setSkus] = useState([]);
  const [formData, setFormData] = useState({
    shipmentType: "INBOUND",
    status: "CREATED",
    deadline: "",
    selectedWorkers: [],
  });
  const [packageCount, setPackageCount] = useState(1);
  const [packages, setPackages] = useState([{ skuId: "", quantity: "" }]);
  const [existingPackages, setExistingPackages] = useState([]);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      // Fetch all required data in parallel
      // Use getWorkers() which is accessible to both ADMIN and SUPERVISOR
      const [
        shipmentResult,
        packagesResult,
        workersResult,
        skusResult,
        assignedWorkersResult,
        shipmentsResult,
      ] = await Promise.allSettled([
        getShipmentById(id),
        getItemsByShipment(id),
        getWorkers(), // Use getWorkers() which is accessible to ADMIN and SUPERVISOR
        getAllSkus(),
        getAssignedWorkers(id),
        getAllShipments(), // Fetch all shipments to filter workers
      ]);

      // Check if critical requests failed
      if (shipmentResult.status === "rejected") {
        throw shipmentResult.reason;
      }
      if (skusResult.status === "rejected") {
        console.error("Error fetching SKUs:", skusResult.reason);
        throw new Error("Failed to load SKUs. Please refresh the page.");
      }
      if (workersResult.status === "rejected") {
        console.error("Error fetching workers:", workersResult.reason);
        throw new Error("Failed to load workers. Please refresh the page.");
      }
      if (packagesResult.status === "rejected") {
        console.error("Error fetching packages:", packagesResult.reason);
      }
      if (assignedWorkersResult.status === "rejected") {
        console.error(
          "Error fetching assigned workers:",
          assignedWorkersResult.reason
        );
      }
      if (shipmentsResult.status === "rejected") {
        console.error("Error fetching shipments:", shipmentsResult.reason);
      }

      // Extract successful results
      const shipmentData = shipmentResult.value;
      const packagesData =
        packagesResult.status === "fulfilled" ? packagesResult.value : [];
      const workersData =
        workersResult.status === "fulfilled" ? workersResult.value : [];
      const skusData =
        skusResult.status === "fulfilled" ? skusResult.value : [];
      const assignedWorkersData =
        assignedWorkersResult.status === "fulfilled"
          ? assignedWorkersResult.value
          : [];
      const shipmentsData =
        shipmentsResult.status === "fulfilled" ? shipmentsResult.value : [];

      console.log("Shipment Data:", shipmentData);
      console.log("Packages Data:", packagesData);
      console.log("Assigned Workers Data:", assignedWorkersData);

      // Filter workers to show only free workers + workers assigned to current shipment
      // Get IDs of workers already assigned to OTHER shipments (not the current one)
      const assignedWorkerIds = new Set();
      if (shipmentsData && Array.isArray(shipmentsData)) {
        shipmentsData
          .filter(
            (shipment) =>
              shipment.id !== parseInt(id) && // Exclude current shipment
              shipment.status &&
              shipment.status !== "COMPLETED" // Only consider active shipments
          )
          .forEach((shipment) => {
            if (
              shipment.assignedWorkers &&
              Array.isArray(shipment.assignedWorkers)
            ) {
              shipment.assignedWorkers.forEach((worker) => {
                if (worker.role === "WORKER" && worker.id) {
                  assignedWorkerIds.add(worker.id);
                }
              });
            }
          });
      }

      // Get IDs of workers assigned to THIS shipment (they should remain visible)
      const currentShipmentWorkerIds = new Set(
        assignedWorkersData.map((w) => Number(w.id))
      );

      // Filter workers: show free workers OR workers assigned to current shipment
      const availableWorkers = workersData.filter(
        (worker) =>
          !assignedWorkerIds.has(worker.id) ||
          currentShipmentWorkerIds.has(worker.id)
      );

      // Set workers and SKUs
      setWorkers(availableWorkers);
      setSkus(skusData);

      // Populate form with shipment data
      // Ensure worker IDs are in the same type as the options (numbers)
      const selectedWorkerIds = assignedWorkersData.map((w) => Number(w.id));

      setFormData({
        shipmentType: shipmentData.shipmentType || "INBOUND",
        status: shipmentData.status || "CREATED",
        deadline: shipmentData.deadline
          ? typeof shipmentData.deadline === "string"
            ? shipmentData.deadline.split("T")[0]
            : shipmentData.deadline
          : "",
        selectedWorkers: selectedWorkerIds,
      });

      // Set packages
      if (packagesData && packagesData.length > 0) {
        setExistingPackages(packagesData);
        const formattedPackages = packagesData.map((pkg) => ({
          id: pkg.id,
          // defensive fallbacks to avoid undefined when rendering
          skuId:
            pkg.skuId !== undefined && pkg.skuId !== null
              ? String(pkg.skuId)
              : "",
          quantity:
            pkg.quantity !== undefined && pkg.quantity !== null
              ? String(pkg.quantity)
              : "",
        }));
        setPackages(formattedPackages);
        setPackageCount(packagesData.length);
      } else {
        // If no packages, ensure we have at least one empty row
        setPackages([{ skuId: "", quantity: "" }]);
        setPackageCount(1);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      console.error("Error details:", err.response?.data);
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Failed to load shipment data";
      setError(
        errorMessage === "Access Denied"
          ? "Access Denied: Failed to load shipment data"
          : errorMessage
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handlePackageCountChange = (e) => {
    const count = parseInt(e.target.value) || 1;
    setPackageCount(Math.max(1, count));

    // Adjust packages array
    const newPackages = [...packages];
    while (newPackages.length < count) {
      newPackages.push({ skuId: "", quantity: "" });
    }
    while (newPackages.length > count) {
      newPackages.pop();
    }
    setPackages(newPackages);
  };

  const handlePackageChange = (index, field, value) => {
    const newPackages = [...packages];
    newPackages[index] = { ...newPackages[index], [field]: value };
    setPackages(newPackages);
  };

  const handleAddPackage = () => {
    setPackages([...packages, { skuId: "", quantity: "" }]);
    setPackageCount(packages.length + 1);
  };

  const handleRemovePackage = (index) => {
    if (packages.length > 1) {
      const newPackages = packages.filter((_, i) => i !== index);
      setPackages(newPackages);
      setPackageCount(newPackages.length);
    }
  };

  const validateForm = () => {
    if (!formData.deadline) {
      setError("Deadline is required");
      return false;
    }

    for (let i = 0; i < packages.length; i++) {
      const pkg = packages[i];
      if (!pkg.skuId || !pkg.quantity || parseInt(pkg.quantity) <= 0) {
        setError(`Package ${i + 1} must have a valid SKU and quantity`);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) {
      return;
    }

    setSaving(true);

    try {
      // 1. Update shipment
      const shipmentPayload = {
        shipmentType: formData.shipmentType,
        status: formData.status,
        deadline: formData.deadline,
      };

      await updateShipment(id, shipmentPayload);

      // 2. Update workers
      // Get current workers and determine which to remove/add
      const currentWorkers = await getAssignedWorkers(id);
      const currentWorkerIds = currentWorkers.map((w) => w.id);
      const newWorkerIds = formData.selectedWorkers;

      // Remove workers that are no longer selected
      const workersToRemove = currentWorkerIds.filter(
        (id) => !newWorkerIds.includes(id)
      );
      for (const workerId of workersToRemove) {
        await removeWorker(id, workerId);
      }

      // Add new workers (assignWorkers handles duplicates)
      const workersToAdd = newWorkerIds.filter(
        (id) => !currentWorkerIds.includes(id)
      );
      if (workersToAdd.length > 0) {
        await assignWorkers(id, workersToAdd);
      }

      // 3. Update packages
      // Delete existing packages that are not in the new list
      const existingPackageIds = existingPackages.map((p) => p.id);
      const newPackageIds = packages.filter((p) => p.id).map((p) => p.id);
      const packagesToDelete = existingPackageIds.filter(
        (id) => !newPackageIds.includes(id)
      );

      for (const packageId of packagesToDelete) {
        await deleteShipmentItem(packageId);
      }

      // Create/update packages
      const packagesToCreate = packages.filter((pkg) => !pkg.id);
      const packagesToUpdate = packages.filter((pkg) => pkg.id);

      // For simplicity, we'll delete and recreate updated packages
      // In a production app, you'd want an update endpoint
      for (const pkg of packagesToUpdate) {
        await deleteShipmentItem(pkg.id);
      }

      // Create all packages (new + updated)
      const allPackagesToCreate = packages.map((pkg) => ({
        shipment: { id: parseInt(id) },
        sku: { id: parseInt(pkg.skuId) },
        quantity: parseInt(pkg.quantity),
        status: "CREATED",
      }));

      if (allPackagesToCreate.length > 0) {
        await createBatchItems(allPackagesToCreate);
      }

      navigate(`/shipments/${id}`);
    } catch (err) {
      console.error("Error updating shipment:", err);
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Failed to update shipment";
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const workerOptions = workers.map((worker) => ({
    value: Number(worker.id),
    label: worker.name,
  }));

  // Debug logging
  useEffect(() => {
    if (!loading) {
      console.log("=== DEBUG INFO ===");
      console.log("Workers:", workers);
      console.log("Worker Options:", workerOptions);
      console.log("Selected Workers in formData:", formData.selectedWorkers);
      console.log("SKUs:", skus);
      console.log("Packages:", packages);
    }
  }, [loading, workers, formData.selectedWorkers, skus, packages]);

  if (loading) return <Loading text="Loading shipment..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate(`/shipments/${id}`)}>
          <ArrowLeft size={20} className="mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Edit Shipment SH-{id}
          </h1>
          <p className="text-gray-600 mt-1">Update shipment details</p>
        </div>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Select
              label="Shipment Type"
              name="shipmentType"
              value={formData.shipmentType}
              onChange={handleChange}
              required
              options={[
                { value: "INBOUND", label: "Inbound" },
                { value: "OUTBOUND", label: "Outbound" },
              ]}
            />

            <Select
              label="Status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              required
              options={[
                { value: "CREATED", label: "Created" },
                { value: "ARRIVED", label: "Arrived" },
                { value: "PUTAWAY", label: "Putaway" },
                { value: "COMPLETED", label: "Completed" },
              ]}
            />
          </div>

          <Input
            label="Deadline"
            type="date"
            name="deadline"
            value={formData.deadline}
            onChange={handleChange}
            required
            error={error && !formData.deadline ? "Deadline is required" : ""}
          />

          <MultiSelect
            label="Assign Workers"
            options={workerOptions}
            value={formData.selectedWorkers}
            onChange={(selected) =>
              setFormData({ ...formData, selectedWorkers: selected })
            }
            placeholder="Select workers..."
            searchable
          />

          <div>
            <Input
              label="Package Count"
              type="number"
              min="1"
              value={packageCount}
              onChange={handlePackageCountChange}
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              Total packages: {packageCount}
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Package Details
              </h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddPackage}
              >
                <Plus size={16} className="mr-2" />
                Add Package
              </Button>
            </div>
            {packages.map((pkg, index) => (
              <PackageInputRow
                key={pkg.id || index}
                pkg={pkg}
                index={index}
                skus={skus}
                onChange={handlePackageChange}
                onRemove={handleRemovePackage}
              />
            ))}
          </div>

          <div className="flex gap-4 pt-4">
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? "Saving..." : "Update Shipment"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(`/shipments/${id}`)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
