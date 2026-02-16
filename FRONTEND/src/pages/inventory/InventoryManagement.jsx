import {
  ArrowRight,
  ArrowRightLeft,
  Edit,
  Eye,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Alert from "../../components/common/Alert";
import Button from "../../components/common/Button";
import Card, { CardContent, CardHeader } from "../../components/common/Card";
import Input from "../../components/common/Input";
import Loading from "../../components/common/Loading";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/common/Table";
import EditQuantityModal from "../../components/inventory/EditQuantityModal";
import TransferStockModal from "../../components/inventory/TransferStockModal";
import {
  deleteInventoryStock,
  getAllInventory,
  transferStock,
  updateInventoryQuantity,
} from "../../services/inventoryService";
import { formatDate } from "../../utils/formatters";

export default function InventoryManagement() {
  const navigate = useNavigate();
  const location = useLocation();
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);

  useEffect(() => {
    fetchInventory();
  }, []);

  // Refresh inventory when navigating to this page (e.g., from Add Stock Entry)
  useEffect(() => {
    if (
      (location.pathname === "/inventory/stock" || location.pathname === "/supervisor/stock") &&
      location.state?.fromAddStock
    ) {
      fetchInventory();
    }
  }, [location.pathname, location.state]);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const data = await getAllInventory();
      setInventory(data);
    } catch (err) {
      setError("Failed to load inventory");
      console.error("Error fetching inventory:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (row) => {
    setSelectedStock(row);
    setEditModalOpen(true);
  };

  const handleTransfer = (row) => {
    setSelectedStock(row);
    setTransferModalOpen(true);
  };

  const handleDelete = async (row) => {
    if (
      !window.confirm(
        `Are you sure you want to delete this inventory record? This will remove ${row.quantity} units of ${row.skuCode} from ${row.binName}.`
      )
    ) {
      return;
    }

    try {
      await deleteInventoryStock(row.id);
      setInventory(inventory.filter((item) => item.id !== row.id));
      setError("");
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to delete inventory record"
      );
    }
  };

  const handleSaveQuantity = async (id, quantity) => {
    await updateInventoryQuantity(id, quantity);
    await fetchInventory();
  };

  const handleTransferStock = async (transferData) => {
    await transferStock(transferData);
    await fetchInventory();
  };

  const filteredInventory = inventory.filter((item) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      item.skuCode?.toLowerCase().includes(searchLower) ||
      item.productName?.toLowerCase().includes(searchLower) ||
      item.binCode?.toLowerCase().includes(searchLower) ||
      item.binName?.toLowerCase().includes(searchLower) ||
      item.zoneName?.toLowerCase().includes(searchLower) ||
      item.rackName?.toLowerCase().includes(searchLower)
    );
  });

  const columns = [
    {
      key: "id",
      label: "ID",
      render: (value) => (
        <button
          onClick={() => navigate(`/inventory/view/${value}`)}
          className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
        >
          #{value}
        </button>
      ),
    },
    {
      key: "skuCode",
      label: "SKU Code",
      render: (value, row) => (
        <div>
          <div className="font-medium text-gray-900">{value}</div>
          <div className="text-sm text-gray-500">{row.productName}</div>
        </div>
      ),
    },
    {
      key: "binLocation",
      label: "Location",
      render: (value, row) => (
        <div>
          <div className="text-sm text-gray-900">
            {row.zoneName && row.rackName ? (
              <>
                {row.zoneName} <ArrowRight className="inline w-3 h-3 mx-1" />{" "}
                {row.rackName} <ArrowRight className="inline w-3 h-3 mx-1" />{" "}
                {row.binName}
              </>
            ) : (
              row.binName || "-"
            )}
          </div>
          {row.binCode && (
            <div className="text-xs text-gray-500">{row.binCode}</div>
          )}
        </div>
      ),
    },
    {
      key: "quantity",
      label: "Quantity",
      render: (value) => (
        <span className="font-semibold text-gray-900">{value}</span>
      ),
    },
    {
      key: "updatedAt",
      label: "Last Updated",
      render: (value) => (
        <span className="text-sm text-gray-600">{formatDate(value)}</span>
      ),
    },
  ];

  if (loading) return <Loading text="Loading inventory..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Inventory Management
          </h1>
          <p className="text-gray-500">
            Manage inventory stock across all locations
          </p>
        </div>
        <Button variant="primary" onClick={() => navigate("/inventory/search")}>
          <Plus className="w-4 h-4 mr-2" />
          Add Stock Entry
        </Button>
      </div>

      {error && (
        <Alert variant="error" onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by SKU code, product name, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((column) => (
                    <TableHead key={column.key}>{column.label}</TableHead>
                  ))}
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInventory.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length + 1}
                      className="text-center py-8 text-gray-500"
                    >
                      No inventory records found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInventory.map((row) => (
                    <TableRow key={row.id}>
                      {columns.map((column) => (
                        <TableCell key={column.key}>
                          {column.render
                            ? column.render(row[column.key], row)
                            : row[column.key]}
                        </TableCell>
                      ))}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              navigate(`/inventory/view/${row.id}`)
                            }
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(row)}
                            title="Edit Quantity"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleTransfer(row)}
                            title="Transfer Stock"
                          >
                            <ArrowRightLeft className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(row)}
                            className="text-red-600 hover:text-red-700"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {editModalOpen && selectedStock && (
        <EditQuantityModal
          isOpen={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setSelectedStock(null);
          }}
          onSave={handleSaveQuantity}
          currentQuantity={selectedStock.quantity}
          stockId={selectedStock.id}
        />
      )}

      {transferModalOpen && selectedStock && (
        <TransferStockModal
          isOpen={transferModalOpen}
          onClose={() => {
            setTransferModalOpen(false);
            setSelectedStock(null);
          }}
          onTransfer={handleTransferStock}
          stock={selectedStock}
        />
      )}
    </div>
  );
}
