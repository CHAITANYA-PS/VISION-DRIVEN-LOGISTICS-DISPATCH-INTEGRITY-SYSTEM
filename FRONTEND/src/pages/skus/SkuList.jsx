import { Filter, Plus, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Alert from "../../components/common/Alert";
import Button from "../../components/common/Button";
import Card, { CardContent, CardHeader } from "../../components/common/Card";
import Input from "../../components/common/Input";
import Loading from "../../components/common/Loading";
import Select from "../../components/common/Select";
import { DataTable } from "../../components/shared/DataTable";
import api from "../../services/api";
import { getAllProducts } from "../../services/productService";
import { deleteSku } from "../../services/skuService";

export default function SkuList() {
  const navigate = useNavigate();
  const [skus, setSkus] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    fetchSkus();
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const data = await getAllProducts();
      setProducts(data);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const fetchSkus = async () => {
    try {
      const response = await api.get("/api/skus/getallskudto");
      setSkus(response.data);
    } catch (error) {
      console.error("Error fetching SKUs:", error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { key: "id", label: "SKU ID" },
    { key: "productName", label: "Product Name" },
    {
      key: "color",
      label: "Variant",
      render: (value, row) => {
        const parts = [];
        if (row.color) parts.push(row.color);
        if (row.dimensions) parts.push(row.dimensions);
        if (row.weight) parts.push(row.weight);
        return parts.length > 0 ? parts.join(", ") : "-";
      },
    },
    { key: "totalQuantity", label: "Quantity" },
    { key: "binLocation", label: "Bin Location" },
    {
      key: "status",
      label: "Status",
      render: (value) => {
        const isLowStock = value === "Low Stock";
        const isOutOfStock = value === "Out of Stock";
        return (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              isOutOfStock
                ? "bg-gray-100 text-gray-800"
                : isLowStock
                ? "bg-red-100 text-red-800"
                : "bg-green-100 text-green-800"
            }`}
          >
            {value}
          </span>
        );
      },
    },
  ];

  const handleDeleteSku = async (row) => {
    if (
      !window.confirm(
        `Are you sure you want to delete SKU "${row.skuCode}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await deleteSku(row.id);
      setSkus(skus.filter((sku) => sku.id !== row.id));
      setDeleteError("");
    } catch (error) {
      console.error("Error deleting SKU:", error);
      setDeleteError(
        "Failed to delete SKU. It may have associated inventory records."
      );
    }
  };

  const filteredSkus = skus.filter((sku) => {
    // Filter by search term
    const matchesSearch =
      !searchTerm ||
      sku.id?.toString().includes(searchTerm) ||
      sku.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sku.skuCode?.toLowerCase().includes(searchTerm.toLowerCase());

    // Filter by selected product
    const matchesProduct =
      !selectedProduct || sku.productId?.toString() === selectedProduct;

    return matchesSearch && matchesProduct;
  });

  if (loading) return <Loading text="Loading SKUs..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            SKU Management
          </h1>
          <p className="text-gray-500">
            Manage stock keeping units and inventory
          </p>
        </div>
        <Button variant="primary" onClick={() => navigate("/skus/create")}>
          <Plus className="w-4 h-4 mr-2" />
          Add SKU
        </Button>
      </div>

      {deleteError && <Alert variant="error">{deleteError}</Alert>}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search SKUs by ID, product name, or barcode..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="w-64">
              <Select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                options={[
                  { value: "", label: "All Products" },
                  ...products.map((product) => ({
                    value: product.id.toString(),
                    label: product.name,
                  })),
                ]}
              />
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("");
                setSelectedProduct("");
              }}
            >
              <Filter className="w-4 h-4 mr-2" />
              Clear
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={filteredSkus}
            onEdit={(row) => navigate(`/skus/${row.id}/edit`)}
            onDelete={handleDeleteSku}
            onView={(row) => navigate(`/skus/${row.id}`)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
