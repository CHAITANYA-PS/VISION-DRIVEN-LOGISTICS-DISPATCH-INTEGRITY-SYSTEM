import { Package, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Alert from "../../components/common/Alert";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import Input from "../../components/common/Input";
import Loading from "../../components/common/Loading";
import Select from "../../components/common/Select";
import { getBinsByRack } from "../../services/binService";
import { getAllInventory, updateStock } from "../../services/inventoryService";
import { getRacksByZone } from "../../services/rackService";
import { getAllSkus } from "../../services/skuService";
import { getAllZones } from "../../services/zoneService";

export default function InventoryStock() {
  const navigate = useNavigate();
  const [skus, setSkus] = useState([]);
  const [zones, setZones] = useState([]);
  const [racks, setRacks] = useState([]);
  const [bins, setBins] = useState([]);
  const [selectedSku, setSelectedSku] = useState("");
  const [selectedZone, setSelectedZone] = useState("");
  const [selectedRack, setSelectedRack] = useState("");
  const [selectedBin, setSelectedBin] = useState("");
  const [quantity, setQuantity] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchInitialData();
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
      setSelectedBin("");
    }
  }, [selectedRack]);

  const fetchInitialData = async () => {
    try {
      const [skusData, zonesData] = await Promise.all([
        getAllSkus(),
        getAllZones(),
      ]);
      setSkus(skusData);
      setZones(zonesData);
      if (zonesData.length > 0) {
        setSelectedZone(zonesData[0].id.toString());
      }
    } catch (err) {
      setError("Failed to load data");
    } finally {
      setLoadingData(false);
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
    try {
      const data = await getBinsByRack(parseInt(selectedRack));
      setBins(data);
      if (data.length > 0) {
        setSelectedBin(data[0].id.toString());
      }
    } catch (err) {
      setError("Failed to load bins");
    }
  };

  const handleAddStock = async () => {
    // Validation
    if (!selectedSku || !selectedBin) {
      setError("Please select both SKU and Bin");
      setSuccess("");
      return;
    }

    if (!quantity || quantity.trim() === "") {
      setError("Please enter a quantity");
      setSuccess("");
      return;
    }

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) {
      setError("Quantity must be a positive number");
      setSuccess("");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");
    try {
      // Use updateStock which performs upsert (creates if doesn't exist, updates if exists)
      const result = await updateStock(
        parseInt(selectedSku),
        parseInt(selectedBin),
        qty
      );

      // Get the stock ID from the result
      let stockId = result?.id;

      // If result doesn't have ID, fetch all inventory to find the newly created/updated stock
      if (!stockId) {
        const allInventory = await getAllInventory();
        const foundStock = allInventory.find(
          (item) =>
            item.skuId === parseInt(selectedSku) &&
            item.binId === parseInt(selectedBin)
        );
        stockId = foundStock?.id;
      }

      // Navigate to stock detail page if we have an ID
      if (stockId) {
        navigate(`/inventory/view/${stockId}`);
      } else {
        // Fallback: navigate to inventory management if we can't find the ID
        setSuccess("Stock entry created/updated successfully!");
        setTimeout(() => {
          navigate("/inventory/stock", { state: { fromAddStock: true } });
        }, 1500);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to add/update stock entry"
      );
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) return <Loading text="Loading data..." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Add Stock Entry</h1>
        <p className="text-gray-600 mt-1">
          Create or update inventory stock entries
        </p>
      </div>

      {error && (
        <Alert variant="error" onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" onClose={() => setSuccess("")}>
          {success}
        </Alert>
      )}

      <Card>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="SKU"
              value={selectedSku}
              onChange={(e) => setSelectedSku(e.target.value)}
              options={[
                { value: "", label: "Select a SKU" },
                ...skus.map((sku) => ({
                  value: sku.id.toString(),
                  label: `${sku.skuCode} - Product #${sku.productId}`,
                })),
              ]}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location (Zone → Rack → Bin)
              </label>
              <div className="space-y-2">
                <Select
                  value={selectedZone}
                  onChange={(e) => setSelectedZone(e.target.value)}
                  options={[
                    { value: "", label: "Select Zone" },
                    ...zones.map((z) => ({
                      value: z.id.toString(),
                      label: z.name,
                    })),
                  ]}
                />
                {selectedZone && (
                  <Select
                    value={selectedRack}
                    onChange={(e) => setSelectedRack(e.target.value)}
                    options={[
                      { value: "", label: "Select Rack" },
                      ...racks.map((r) => ({
                        value: r.id.toString(),
                        label: r.name,
                      })),
                    ]}
                  />
                )}
                {selectedRack && (
                  <Select
                    value={selectedBin}
                    onChange={(e) => setSelectedBin(e.target.value)}
                    options={[
                      { value: "", label: "Select Bin" },
                      ...bins.map((b) => ({
                        value: b.id.toString(),
                        label: b.name,
                      })),
                    ]}
                  />
                )}
              </div>
            </div>
          </div>

          <div>
            <Input
              label="Quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => {
                setQuantity(e.target.value);
                setError("");
              }}
              placeholder="Enter quantity"
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              Enter the quantity of stock to add or update for this SKU in the
              selected bin location.
            </p>
          </div>

          <Button
            variant="primary"
            onClick={handleAddStock}
            disabled={loading || !selectedSku || !selectedBin || !quantity}
          >
            <Plus size={20} className="mr-2" />
            {loading ? "Adding..." : "Add/Update Stock Entry"}
          </Button>
        </div>
      </Card>

      {!loading && success === "" && (
        <Card>
          <div className="text-center py-8 text-gray-500">
            <Package size={48} className="mx-auto mb-4 text-gray-400" />
            <p>Select SKU, location, and enter quantity to add stock entry</p>
          </div>
        </Card>
      )}
    </div>
  );
}
