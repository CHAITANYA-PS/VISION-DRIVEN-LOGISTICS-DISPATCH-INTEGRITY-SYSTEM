import { useState, useEffect, useRef } from 'react';
import { Package, Clock, CheckCircle, Truck } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import Loading from '../../components/common/Loading';
import Alert from '../../components/common/Alert';
import SummaryCard from '../../components/picking/SummaryCard';
import PickListItem from '../../components/picking/PickListItem';
import PickingDetailModal from '../../components/picking/PickingDetailModal';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/common/Tabs';
import { getPickingItems, getPickingStatistics, completePicking, getDispatchedPickingItems } from '../../services/taskService';
import { getUserId } from '../../services/authService';
import { groupTasksByShipment } from '../../utils/pickingUtils';

export default function Picking() {
  const [pickingItems, setPickingItems] = useState([]);
  const [dispatchedItems, setDispatchedItems] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [selectedPickList, setSelectedPickList] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('active');
  const selectedShipmentIdRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const userId = parseInt(getUserId());
      
      const [itemsData, dispatchedData, statsData] = await Promise.all([
        getPickingItems(userId),
        getDispatchedPickingItems(userId),
        getPickingStatistics(userId)
      ]);
      
      setPickingItems(itemsData);
      setDispatchedItems(dispatchedData);
      setStatistics(statsData);
    } catch (err) {
      setError('Failed to load picking data');
      console.error('Error fetching picking data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartPicking = (pickList) => {
    setSelectedPickList(pickList);
    selectedShipmentIdRef.current = pickList.shipmentId;
  };

  const handleCompletePicking = async (taskId) => {
    try {
      const userId = parseInt(getUserId());
      await completePicking(taskId, userId);
      // Don't refresh here - let the modal handle it after all items are dispatched
    } catch (err) {
      // Log the full error for debugging
      console.error('Error completing picking:', err);
      console.error('Error response:', err.response?.data);
      throw err; // Re-throw to let modal handle it
    }
  };

  const handleCloseModal = () => {
    setSelectedPickList(null);
    selectedShipmentIdRef.current = null;
    fetchData(); // Refresh data when modal closes
  };

  // Update selectedPickList when pickingItems changes (after refresh)
  useEffect(() => {
    if (selectedShipmentIdRef.current && pickingItems.length >= 0) {
      const pickLists = groupTasksByShipment(pickingItems);
      const updatedPickList = pickLists.find(pl => pl.shipmentId === selectedShipmentIdRef.current);
      if (updatedPickList) {
        setSelectedPickList(updatedPickList);
      } else {
        // Pick list no longer exists (all items dispatched), close modal
        setSelectedPickList(null);
        selectedShipmentIdRef.current = null;
      }
    }
  }, [pickingItems]);

  if (loading) return <Loading text="Loading picking operations..." />;

  // Group tasks by shipment
  const pickLists = groupTasksByShipment(pickingItems);
  const dispatchedPickLists = groupTasksByShipment(dispatchedItems);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Outbound Picking</h1>
        <p className="text-gray-600 mt-1">Pick and verify items for outbound shipments</p>
      </div>

      {error && (
        <Alert variant="error" onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <SummaryCard
            title="Active Pick Lists"
            value={statistics.activePickListsCount || 0}
            icon={Package}
            color="blue"
          />
          <SummaryCard
            title="Items to Pick"
            value={statistics.itemsToPickCount || 0}
            icon={Clock}
            color="orange"
          />
          <SummaryCard
            title="Picked Today"
            value={statistics.pickedTodayCount || 0}
            icon={CheckCircle}
            color="green"
          />
          <SummaryCard
            title="Ready to Ship"
            value={statistics.readyToShipCount || 0}
            icon={Truck}
            color="purple"
          />
        </div>
      )}

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel: Pick Lists with Tabs */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Pick Lists</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="active">Active Pick Lists</TabsTrigger>
                  <TabsTrigger value="dispatched">Ready to Ship</TabsTrigger>
                </TabsList>
                
                <TabsContent value="active">
                  {pickLists.length === 0 ? (
                    <div className="text-center py-12">
                      <Package size={48} className="mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-500">No pick lists available</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pickLists.map((pickList) => (
                        <PickListItem
                          key={pickList.shipmentId}
                          pickList={pickList}
                          currentUserId={parseInt(getUserId())}
                          onStartPicking={handleStartPicking}
                          isDispatched={false}
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="dispatched">
                  {dispatchedPickLists.length === 0 ? (
                    <div className="text-center py-12">
                      <Truck size={48} className="mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-500">No items ready to ship</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {dispatchedPickLists.map((pickList) => (
                        <PickListItem
                          key={pickList.shipmentId}
                          pickList={pickList}
                          currentUserId={parseInt(getUserId())}
                          onStartPicking={handleStartPicking}
                          isDispatched={true}
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel: Getting Started */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Getting Started</CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedPickList ? (
                <div className="text-center py-12">
                  <Package size={64} className="mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500 mb-2">Select a pick list to begin</p>
                  <p className="text-sm text-gray-400">
                    Choose a pick list from the left to start picking items
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-2">
                      {selectedPickList.shipmentId ? `PL-${new Date().getFullYear()}-${String(selectedPickList.shipmentId).padStart(3, '0')}` : 'Selected Pick List'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {selectedPickList.destination || 'N/A'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {selectedPickList.tasks.length} items to pick
                    </p>
                  </div>
                  <p className="text-sm text-gray-600">
                    Click "Start Picking" on the pick list card to begin the picking process.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Picking Detail Modal */}
      {selectedPickList && (
        <PickingDetailModal
          isOpen={!!selectedPickList}
          onClose={handleCloseModal}
          pickList={selectedPickList}
          onComplete={handleCompletePicking}
          onRefresh={fetchData}
        />
      )}
    </div>
  );
}
