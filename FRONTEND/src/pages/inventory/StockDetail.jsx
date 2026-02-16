import {
  ArrowLeft,
  ArrowRightLeft,
  CheckCircle,
  Edit,
  MapPin,
  Package,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Alert from "../../components/common/Alert";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Card, {
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/common/Card";
import Loading from "../../components/common/Loading";
import EditQuantityModal from "../../components/inventory/EditQuantityModal";
import TransferStockModal from "../../components/inventory/TransferStockModal";
import {
  deleteInventoryStock,
  getAllInventory,
  transferStock,
  updateInventoryQuantity,
} from "../../services/inventoryService";
import { formatDate } from "../../utils/formatters";

export default function StockDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [stock, setStock] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);

  useEffect(() => {
    fetchStock();
  }, [id]);

  const fetchStock = async () => {
    try {
      setLoading(true);
      const allInventory = await getAllInventory();
      const stockData = allInventory.find((item) => item.id.toString() === id);
      if (stockData) {
        setStock(stockData);
      } else {
        setError("Stock entry not found");
      }
    } catch (err) {
      setError("Failed to load stock details");
      console.error("Error fetching stock:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (
      !window.confirm(
        `Are you sure you want to delete this inventory record? This will remove ${stock.quantity} units of ${stock.skuCode} from ${stock.binName}.`
      )
    ) {
      return;
    }

    try {
      await deleteInventoryStock(stock.id);
      navigate("/inventory/stock");
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to delete inventory record"
      );
    }
  };

  const handleSaveQuantity = async (stockId, quantity) => {
    try {
      await updateInventoryQuantity(stockId, quantity);
      await fetchStock();
      setEditModalOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update quantity");
    }
  };

  const handleTransferStock = async (transferData) => {
    try {
      await transferStock(transferData);
      // After transfer, the stock might be deleted if quantity becomes 0
      // Navigate back to inventory management
      navigate("/inventory/stock");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to transfer stock");
    }
  };

  if (loading) return <Loading text="Loading stock details..." />;

  if (error && !stock) {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={() => navigate("/inventory/stock")}>
          <ArrowLeft size={20} className="mr-2" />
          Back to Inventory Management
        </Button>
        <Card>
          <div className="text-center py-8 text-gray-500">
            {error || "Stock entry not found"}
          </div>
        </Card>
      </div>
    );
  }

  if (!stock) {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={() => navigate("/inventory/stock")}>
          <ArrowLeft size={20} className="mr-2" />
          Back to Inventory Management
        </Button>
        <Card>
          <div className="text-center py-8 text-gray-500">
            Stock entry not found
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate("/inventory/stock")}>
          <ArrowLeft size={20} className="mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Stock Entry #{stock.id}
          </h1>
          <p className="text-gray-600 mt-1">Inventory Stock Details</p>
        </div>
      </div>

      {error && (
        <Alert variant="error" onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Stock Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Stock ID
                  </label>
                  <p className="text-gray-900 font-semibold text-lg">
                    #{stock.id}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Quantity
                  </label>
                  <p className="text-gray-900 font-semibold text-2xl">
                    {stock.quantity || 0}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Status
                  </label>
                  <div className="mt-1">
                    <Badge variant={stock.quantity > 0 ? "green" : "red"}>
                      {stock.quantity > 0 ? "In Stock" : "Out of Stock"}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Last Updated
                  </label>
                  <p className="text-gray-900 font-semibold">
                    {stock.updatedAt ? formatDate(stock.updatedAt) : "-"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>SKU Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">
                  SKU ID
                </label>
                <p className="text-gray-900 font-semibold">#{stock.skuId}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  SKU Code
                </label>
                <p className="text-gray-900 font-semibold text-lg">
                  {stock.skuCode}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Product Name
                </label>
                <p className="text-gray-900">{stock.productName || "-"}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Location Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Bin ID
                </label>
                <p className="text-gray-900 font-semibold">#{stock.binId}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Bin Name
                </label>
                <p className="text-gray-900 font-semibold">{stock.binName}</p>
              </div>
              {stock.binCode && (
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Bin Code
                  </label>
                  <p className="text-gray-900">{stock.binCode}</p>
                </div>
              )}
              {stock.zoneName && stock.rackName && (
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Full Location Path
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <MapPin size={16} className="text-gray-400" />
                    <p className="text-gray-900">
                      {stock.zoneName} → {stock.rackName} → {stock.binName}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setEditModalOpen(true)}
              >
                <Edit size={20} className="mr-2" />
                Edit Quantity
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setTransferModalOpen(true)}
              >
                <ArrowRightLeft size={20} className="mr-2" />
                Transfer Stock
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate(`/skus/${stock.skuId}`)}
              >
                <Package size={20} className="mr-2" />
                View SKU Details
              </Button>
              <Button
                variant="outline"
                className="w-full text-red-600 hover:text-red-700"
                onClick={handleDelete}
              >
                <Trash2 size={20} className="mr-2" />
                Delete Stock Entry
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {stock.quantity} units
                  </p>
                  <p className="text-xs text-gray-500">Available in stock</p>
                </div>
              </div>
              {stock.updatedAt && (
                <div>
                  <p className="text-xs text-gray-500">Last updated</p>
                  <p className="text-sm font-medium text-gray-900">
                    {formatDate(stock.updatedAt)}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {editModalOpen && stock && (
        <EditQuantityModal
          isOpen={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
          }}
          onSave={handleSaveQuantity}
          currentQuantity={stock.quantity}
          stockId={stock.id}
        />
      )}

      {transferModalOpen && stock && (
        <TransferStockModal
          isOpen={transferModalOpen}
          onClose={() => {
            setTransferModalOpen(false);
          }}
          onTransfer={handleTransferStock}
          stock={stock}
        />
      )}
    </div>
  );
}
