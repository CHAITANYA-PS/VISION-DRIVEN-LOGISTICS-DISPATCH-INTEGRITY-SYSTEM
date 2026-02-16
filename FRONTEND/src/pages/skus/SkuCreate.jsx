import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Alert from "../../components/common/Alert";
import Button from "../../components/common/Button";
import Card, { CardContent } from "../../components/common/Card";
import Input from "../../components/common/Input";
import Loading from "../../components/common/Loading";
import Select from "../../components/common/Select";
import { getBinsByRack } from "../../services/binService";
import { getAllProducts } from "../../services/productService";
import { getRacksByZone } from "../../services/rackService";
import { createSku } from "../../services/skuService";
import { getAllZones } from "../../services/zoneService";

export default function SkuCreate() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingZones, setLoadingZones] = useState(false);
  const [loadingRacks, setLoadingRacks] = useState(false);
  const [loadingBins, setLoadingBins] = useState(false);
  const [error, setError] = useState("");
  const [products, setProducts] = useState([]);
  const [zones, setZones] = useState([]);
  const [racks, setRacks] = useState([]);
  const [bins, setBins] = useState([]);
  const [formData, setFormData] = useState({
    productId: searchParams.get("productId") || "",
    skuCode: "",
    color: "",
    dimensions: "",
    weight: "",
    selectedZone: "",
    selectedRack: "",
    selectedBin: "",
    initialQuantity: "",
  });

  useEffect(() => {
    fetchProducts();
    fetchZones();
  }, []);

  useEffect(() => {
    if (formData.selectedZone) {
      fetchRacks();
    } else {
      setRacks([]);
      setBins([]);
      setFormData((prev) => ({
        ...prev,
        selectedRack: "",
        selectedBin: "",
        initialQuantity: "",
      }));
    }
  }, [formData.selectedZone]);

  useEffect(() => {
    if (formData.selectedRack) {
      fetchBins();
    } else {
      setBins([]);
      setFormData((prev) => ({
        ...prev,
        selectedBin: "",
        initialQuantity: "",
      }));
    }
  }, [formData.selectedRack]);

  const fetchProducts = async () => {
    try {
      const data = await getAllProducts();
      setProducts(data);
    } catch (err) {
      setError("Failed to load products");
    } finally {
      setLoadingProducts(false);
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
      const data = await getRacksByZone(parseInt(formData.selectedZone));
      setRacks(data);
      setBins([]);
      setFormData((prev) => ({
        ...prev,
        selectedRack: "",
        selectedBin: "",
        initialQuantity: "",
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
      const data = await getBinsByRack(parseInt(formData.selectedRack));
      setBins(data);
      setFormData((prev) => ({
        ...prev,
        selectedBin: "",
        initialQuantity: "",
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validate: if bin is selected, quantity is required
    if (formData.selectedBin && !formData.initialQuantity) {
      setError("Initial quantity is required when a bin location is selected");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        productId: parseInt(formData.productId),
        skuCode: formData.skuCode,
        color: formData.color || null,
        dimensions: formData.dimensions || null,
        weight: formData.weight || null,
        binId: formData.selectedBin ? parseInt(formData.selectedBin) : null,
        initialQuantity:
          formData.selectedBin && formData.initialQuantity
            ? parseInt(formData.initialQuantity)
            : null,
      };
      await createSku(payload);
      navigate("/skus");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create SKU");
    } finally {
      setLoading(false);
    }
  };

  if (loadingProducts) return <Loading text="Loading products..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate("/skus")}>
          <ArrowLeft size={20} className="mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create SKU</h1>
          <p className="text-gray-600 mt-1">Add a new Stock Keeping Unit</p>
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
                Bin Location Assignment (Optional)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Select
                  label="Zone"
                  name="selectedZone"
                  value={formData.selectedZone}
                  onChange={handleChange}
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
                  value={formData.selectedRack}
                  onChange={handleChange}
                  disabled={!formData.selectedZone || loadingRacks}
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
                  value={formData.selectedBin}
                  onChange={handleChange}
                  disabled={!formData.selectedRack || loadingBins}
                  options={[
                    { value: "", label: "Select a bin" },
                    ...bins.map((b) => ({
                      value: b.id.toString(),
                      label: `${b.name}${b.code ? ` (${b.code})` : ""}`,
                    })),
                  ]}
                />
              </div>

              {formData.selectedBin && (
                <div className="mt-4">
                  <Input
                    label="Initial Quantity"
                    name="initialQuantity"
                    type="number"
                    min="1"
                    value={formData.initialQuantity}
                    onChange={handleChange}
                    required
                    placeholder="Enter initial stock quantity"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    This will create an inventory stock entry for this SKU in
                    the selected bin.
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? "Creating..." : "Create SKU"}
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
