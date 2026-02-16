import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Alert from "../../components/common/Alert";
import Button from "../../components/common/Button";
import Card, { CardContent } from "../../components/common/Card";
import Input from "../../components/common/Input";
import Loading from "../../components/common/Loading";
import Select from "../../components/common/Select";
import api from "../../services/api";
import { getBinsByRack } from "../../services/binService";
import { getAllProducts } from "../../services/productService";
import { getRacksByZone } from "../../services/rackService";
import { getAllZones } from "../../services/zoneService";

export default function SkuEdit() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingZones, setLoadingZones] = useState(false);
  const [loadingRacks, setLoadingRacks] = useState(false);
  const [loadingBins, setLoadingBins] = useState(false);
  const [error, setError] = useState("");
  const [products, setProducts] = useState([]);
  const [zones, setZones] = useState([]);
  const [racks, setRacks] = useState([]);
  const [bins, setBins] = useState([]);
  const [inventoryStocks, setInventoryStocks] = useState([]);
  const [formData, setFormData] = useState({
    productId: "",
    skuCode: "",
    color: "",
    dimensions: "",
    weight: "",
  });
  const [newLocation, setNewLocation] = useState({
    selectedZone: "",
    selectedRack: "",
    selectedBin: "",
    quantity: "",
  });

  useEffect(() => {
    fetchData();
    fetchZones();
  }, [id]);

  useEffect(() => {
    if (newLocation.selectedZone) {
      fetchRacks();
    } else {
      setRacks([]);
      setBins([]);
      setNewLocation((prev) => ({
        ...prev,
        selectedRack: "",
        selectedBin: "",
      }));
    }
  }, [newLocation.selectedZone]);

  useEffect(() => {
    if (newLocation.selectedRack) {
      fetchBins();
    } else {
      setBins([]);
      setNewLocation((prev) => ({
        ...prev,
        selectedBin: "",
      }));
    }
  }, [newLocation.selectedRack]);

  const fetchData = async () => {
    try {
      const [productsData, skuResponse] = await Promise.all([
        getAllProducts(),
        api.get("/api/skus/getallskudto"),
      ]);

      setProducts(productsData);

      const skuData = skuResponse.data.find((s) => s.id === parseInt(id));
      if (skuData) {
        setFormData({
          productId: skuData.productId || "",
          skuCode: skuData.skuCode || "",
          color: skuData.color || "",
          dimensions: skuData.dimensions || "",
          weight: skuData.weight || "",
        });

        // Fetch inventory stocks for this SKU
        fetchInventoryStocks();
      } else {
        setError("SKU not found");
      }
    } catch (err) {
      setError("Failed to load SKU data");
      console.error("Error fetching data:", err);
    } finally {
      setLoadingData(false);
    }
  };

  const fetchInventoryStocks = async () => {
    try {
      // This would need a backend endpoint to get inventory stocks by SKU ID
      // For now, we'll skip loading existing locations
      setInventoryStocks([]);
    } catch (err) {
      console.error("Error fetching inventory stocks:", err);
    }
  };

  const fetchZones = async () => {
    setLoadingZones(true);
    try {
      const data = await getAllZones();
      setZones(data);
    } catch (err) {
      setError("Failed to load zones");
    } finally {
      setLoadingZones(false);
    }
  };

  const fetchRacks = async () => {
    setLoadingRacks(true);
    try {
      const data = await getRacksByZone(parseInt(newLocation.selectedZone));
      setRacks(data);
      setBins([]);
      setNewLocation((prev) => ({
        ...prev,
        selectedRack: "",
        selectedBin: "",
      }));
    } catch (err) {
      setError("Failed to load racks");
    } finally {
      setLoadingRacks(false);
    }
  };

  const fetchBins = async () => {
    setLoadingBins(true);
    try {
      const data = await getBinsByRack(parseInt(newLocation.selectedRack));
      setBins(data);
      setNewLocation((prev) => ({
        ...prev,
        selectedBin: "",
      }));
    } catch (err) {
      setError("Failed to load bins");
    } finally {
      setLoadingBins(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleLocationChange = (e) => {
    setNewLocation({ ...newLocation, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload = {
        productId: parseInt(formData.productId),
        skuCode: formData.skuCode,
        color: formData.color || null,
        dimensions: formData.dimensions || null,
        weight: formData.weight || null,
      };

      await api.put(`/api/skus/update/${id}`, payload);

      // If new location is added, create inventory stock entry
      if (newLocation.selectedBin && newLocation.quantity) {
        try {
          await api.put("/api/inventory/update", {
            skuId: parseInt(id),
            binId: parseInt(newLocation.selectedBin),
            quantity: parseInt(newLocation.quantity),
          });
        } catch (invErr) {
          console.error("Error updating inventory location:", invErr);
          // Don't fail the whole operation if inventory update fails
        }
      }

      navigate("/skus");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update SKU");
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) return <Loading text="Loading SKU..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate("/skus")}>
          <ArrowLeft size={20} className="mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit SKU</h1>
          <p className="text-gray-600 mt-1">
            Update Stock Keeping Unit details
          </p>
        </div>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <Card>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6 pt-6">
            <Select
              label="Product"
              name="productId"
              value={formData.productId}
              onChange={handleChange}
              required
              options={[
                { value: "", label: "Select a product" },
                ...products.map((p) => ({
                  value: p.id,
                  label: `${p.name} (${p.category})`,
                })),
              ]}
            />

            <Input
              label="SKU Code"
              name="skuCode"
              value={formData.skuCode}
              onChange={handleChange}
              required
              placeholder="e.g., PROD-001-BLUE"
            />

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Product Variants
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Color"
                  name="color"
                  value={formData.color}
                  onChange={handleChange}
                  placeholder="e.g., Red, Blue"
                />

                <Input
                  label="Dimensions"
                  name="dimensions"
                  value={formData.dimensions}
                  onChange={handleChange}
                  placeholder="e.g., 10x20x30 cm"
                />

                <div>
                  <Input
                    label="Weight"
                    name="weight"
                    type="text"
                    value={formData.weight}
                    onChange={handleChange}
                    placeholder="e.g., 2.5"
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Update Inventory Location (Optional)
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Add or update inventory stock in a specific bin location
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Select
                  label="Zone"
                  name="selectedZone"
                  value={newLocation.selectedZone}
                  onChange={handleLocationChange}
                  disabled={loadingZones}
                  options={[
                    { value: "", label: "Select a zone" },
                    ...zones.map((z) => ({
                      value: z.id.toString(),
                      label: z.name,
                    })),
                  ]}
                />

                <Select
                  label="Rack"
                  name="selectedRack"
                  value={newLocation.selectedRack}
                  onChange={handleLocationChange}
                  disabled={!newLocation.selectedZone || loadingRacks}
                  options={[
                    { value: "", label: "Select a rack" },
                    ...racks.map((r) => ({
                      value: r.id.toString(),
                      label: r.name,
                    })),
                  ]}
                />

                <Select
                  label="Bin"
                  name="selectedBin"
                  value={newLocation.selectedBin}
                  onChange={handleLocationChange}
                  disabled={!newLocation.selectedRack || loadingBins}
                  options={[
                    { value: "", label: "Select a bin" },
                    ...bins.map((b) => ({
                      value: b.id.toString(),
                      label: `${b.name}${b.code ? ` (${b.code})` : ""}`,
                    })),
                  ]}
                />
              </div>

              {newLocation.selectedBin && (
                <div className="mt-4">
                  <Input
                    label="Quantity"
                    name="quantity"
                    type="number"
                    min="0"
                    value={newLocation.quantity}
                    onChange={handleLocationChange}
                    placeholder="Enter quantity for this location"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    This will update or create an inventory stock entry for this
                    SKU in the selected bin.
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? "Updating..." : "Update SKU"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/skus")}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
