import { ArrowLeft, Edit, Package } from "lucide-react";
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
import { getProductById } from "../../services/productService";
import { formatDate } from "../../utils/formatters";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const data = await getProductById(id);
      setProduct(data);
    } catch (err) {
      setError("Failed to load product details");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading text="Loading product..." />;
  if (error || !product) {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={() => navigate("/products")}>
          <ArrowLeft size={20} className="mr-2" />
          Back to Products
        </Button>
        <Card>
          <div className="text-center py-8 text-gray-500">
            {error || "Product not found"}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate("/products")}>
            <ArrowLeft size={20} className="mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
            <p className="text-gray-600 mt-1">Product Details</p>
          </div>
        </div>
        <Button
          variant="primary"
          onClick={() => navigate(`/products/${id}/edit`)}
        >
          <Edit size={20} className="mr-2" />
          Edit
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Product Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Product ID
                </label>
                <p className="text-gray-900 font-semibold">#{product.id}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Product Code
                </label>
                <p className="text-gray-900 font-semibold">{product.productCode}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Name
                </label>
                <p className="text-gray-900">{product.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Category
                </label>
                <div className="mt-1">
                  <Badge variant="blue">{product.category}</Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Description
                </label>
                <p className="text-gray-900 mt-1">
                  {product.description || "No description provided"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Status
                </label>
                <div className="mt-1">
                  <Badge variant={
                    product.status === "Active" ? "green" : 
                    product.status === "Low Stock" ? "red" : 
                    "gray"
                  }>
                    {product.status || "Active"}
                  </Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Created At
                </label>
                <p className="text-gray-900">{formatDate(product.createdAt)}</p>
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
                onClick={() => navigate(`/skus?productId=${product.id}`)}
              >
                <Package size={20} className="mr-2" />
                View SKUs
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
