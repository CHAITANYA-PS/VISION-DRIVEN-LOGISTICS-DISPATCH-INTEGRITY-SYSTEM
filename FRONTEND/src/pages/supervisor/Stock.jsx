import { useState, useEffect } from 'react';
import { TrendingUp, AlertTriangle, Package } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Loading from '../../components/common/Loading';
import Alert from '../../components/common/Alert';
import { getAllSkus } from '../../services/skuService';

export default function Stock() {
  const [skus, setSkus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStock();
  }, []);

  const fetchStock = async () => {
    try {
      const data = await getAllSkus();
      setSkus(data);
    } catch (err) {
      setError('Failed to load stock information');
    } finally {
      setLoading(false);
    }
  };

  // Mock stock levels - replace with actual inventory data
  const getStockLevel = (skuId) => {
    // This would come from inventory API
    return Math.floor(Math.random() * 100);
  };

  const lowStockItems = skus.filter(sku => {
    const stock = getStockLevel(sku.id);
    return stock < 10;
  });

  if (loading) return <Loading text="Loading stock information..." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Stock Overview</h1>
        <p className="text-gray-600 mt-1">Monitor inventory levels and alerts</p>
      </div>

      {error && (
        <Alert variant="error" onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-500">Total SKUs</div>
                <div className="text-3xl font-bold text-gray-900 mt-2">{skus.length}</div>
              </div>
              <Package className="text-primary" size={40} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-500">Low Stock Items</div>
                <div className="text-3xl font-bold text-red-600 mt-2">{lowStockItems.length}</div>
              </div>
              <AlertTriangle className="text-red-500" size={40} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-500">In Stock Items</div>
                <div className="text-3xl font-bold text-green-600 mt-2">
                  {skus.length - lowStockItems.length}
                </div>
              </div>
              <TrendingUp className="text-green-500" size={40} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alerts */}
      {lowStockItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="text-red-500" size={20} />
              Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lowStockItems.slice(0, 10).map((sku) => (
                <div
                  key={sku.id}
                  className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">{sku.skuCode}</p>
                    <p className="text-sm text-gray-600">Product #{sku.productId}</p>
                  </div>
                  <Badge variant="red">Low Stock</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stock Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Stock Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Package size={48} className="mx-auto mb-4 text-gray-400" />
            <p>Detailed stock information will be displayed here</p>
            <p className="text-sm mt-2">Use the Inventory Stock page for detailed queries</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

