import { ArrowLeft, Edit, MapPin, Package, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Card, {
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/common/Card";
import Loading from "../../components/common/Loading";
import api from "../../services/api";

export default function SkuDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sku, setSku] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchSku();
  }, [id]);

  const fetchSku = async () => {
    try {
      const response = await api.get(`/api/skus/getallskudto`);
      const skuData = response.data.find((s) => s.id === parseInt(id));
      if (skuData) {
        setSku(skuData);
      } else {
        setError("SKU not found");
      }
    } catch (err) {
      setError("Failed to load SKU details");
      console.error("Error fetching SKU:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading text="Loading SKU..." />;

  if (error || !sku) {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={() => navigate("/skus")}>
          <ArrowLeft size={20} className="mr-2" />
          Back to SKUs
        </Button>
        <Card>
          <div className="text-center py-8 text-gray-500">
            {error || "SKU not found"}
          </div>
        </Card>
      </div>
    );
  }

  const getStatusBadgeVariant = (status) => {
    if (status === "Out of Stock") return "gray";
    if (status === "Low Stock") return "red";
    return "green";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate("/skus")}>
            <ArrowLeft size={20} className="mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{sku.skuCode}</h1>
            <p className="text-gray-600 mt-1">SKU Details</p>
          </div>
        </div>
        <Button variant="primary" onClick={() => navigate(`/skus/${id}/edit`)}>
          <Edit size={20} className="mr-2" />
          Edit
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>SKU Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">
                  SKU ID
                </label>
                <p className="text-gray-900 font-semibold">#{sku.id}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  SKU Code
                </label>
                <p className="text-gray-900">{sku.skuCode}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Product Name
                </label>
                <p className="text-gray-900">{sku.productName}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Variant Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Color
                </label>
                <p className="text-gray-900">{sku.color || "-"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Dimensions
                </label>
                <p className="text-gray-900">{sku.dimensions || "-"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Weight
                </label>
                <p className="text-gray-900">{sku.weight || "-"}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Status
                </label>
                <div className="mt-1">
                  <Badge variant={getStatusBadgeVariant(sku.status)}>
                    {sku.status}
                  </Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Total Quantity
                </label>
                <p className="text-2xl font-bold text-gray-900">
                  {sku.totalQuantity}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Primary Location
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <MapPin size={16} className="text-gray-400" />
                  <p className="text-gray-900">{sku.binLocation}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate(`/products/${sku.productId}`)}
              >
                <Package size={20} className="mr-2" />
                View Product
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate(`/inventory/stock?skuId=${sku.id}`)}
              >
                <TrendingUp size={20} className="mr-2" />
                View Inventory
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
