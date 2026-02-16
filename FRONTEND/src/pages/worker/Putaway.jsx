import { useState, useEffect } from 'react';
import { MapPin, Package, CheckCircle, Box, ArrowRight } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';
import Alert from '../../components/common/Alert';
import SummaryCard from '../../components/putaway/SummaryCard';
import PutawayItemCard from '../../components/putaway/PutawayItemCard';
import RecentCompletionItem from '../../components/putaway/RecentCompletionItem';
import PutawayFormModal from '../../components/putaway/PutawayFormModal';
import {
  getPutawayItems,
  getPutawayStatistics,
  getRecentCompletions,
  startPutaway,
  completePutaway,
  completePutawayWithAllocation,
} from '../../services/taskService';
import { getUserId } from '../../services/authService';

export default function Putaway() {
  const [items, setItems] = useState([]);
  const [statistics, setStatistics] = useState({
    pendingCount: 0,
    inProgressCount: 0,
    completedTodayCount: 0,
    totalItemsCount: 0,
  });
  const [recentCompletions, setRecentCompletions] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const userId = getUserId();
      if (!userId) {
        setError('User ID not found. Please log in again.');
        setLoading(false);
        return;
      }

      const [itemsData, statsData, completionsData] = await Promise.all([
        getPutawayItems(parseInt(userId)),
        getPutawayStatistics(parseInt(userId)),
        getRecentCompletions(parseInt(userId)),
      ]);

      setItems(itemsData);
      setStatistics(statsData);
      setRecentCompletions(completionsData);
    } catch (err) {
      setError('Failed to load putaway data');
      console.error('Error fetching putaway data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartPutaway = async (item) => {
    // Don't allow starting putaway if there's a zone capacity error
    if (item.hasError && item.zoneCapacityFull) {
      setError(item.errorMessage || 'Zone capacity is full. Please request bin location allocation from supervisor.');
      return;
    }

    try {
      // Mark task as in progress
      await startPutaway(item.id);
      setSelectedItem(item);
      setIsModalOpen(true);
      // Refresh data to update status
      fetchData();
    } catch (err) {
      setError('Failed to start putaway');
      console.error('Error starting putaway:', err);
    }
  };

  const handleCompletePutaway = async (taskId, binId, quantity, allocations) => {
    try {
      if (allocations) {
        // Multi-bin allocation
        await completePutawayWithAllocation(taskId, allocations);
      } else {
        // Single bin allocation
        await completePutaway(taskId, binId, quantity);
      }
      setIsModalOpen(false);
      setSelectedItem(null);
      // Refresh data
      await fetchData();
    } catch (err) {
      throw err; // Let the modal handle the error
    }
  };

  if (loading) return <Loading text="Loading putaway tasks..." />;

  const pendingItems = items.filter(item => item.status === 'PENDING');
  const inProgressItems = items.filter(item => item.status === 'IN_PROGRESS');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Putaway Operations</h1>
        <p className="text-gray-600 mt-1">Store verified items in optimal warehouse locations</p>
      </div>

      {error && (
        <Alert variant="error" onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard
          title="Pending"
          value={statistics.pendingCount}
          icon={Package}
          color="orange"
        />
        <SummaryCard
          title="In Progress"
          value={statistics.inProgressCount}
          icon={Box}
          color="blue"
        />
        <SummaryCard
          title="Completed Today"
          value={statistics.completedTodayCount}
          icon={CheckCircle}
          color="green"
        />
        <SummaryCard
          title="Total Items"
          value={statistics.totalItemsCount}
          icon={Package}
          color="purple"
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel: Pending Putaway Items */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Putaway Items</CardTitle>
            </CardHeader>
            <CardContent>
              {pendingItems.length === 0 && inProgressItems.length === 0 ? (
                <div className="text-center py-12">
                  <MapPin size={48} className="mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500">No putaway tasks available</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* In Progress Items First */}
                  {inProgressItems.map((item) => (
                    <PutawayItemCard
                      key={item.id}
                      item={item}
                      onStartPutaway={handleStartPutaway}
                    />
                  ))}
                  {/* Pending Items */}
                  {pendingItems.map((item) => (
                    <PutawayItemCard
                      key={item.id}
                      item={item}
                      onStartPutaway={handleStartPutaway}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Panel: Recent Completions & Quick Actions */}
        <div className="space-y-6">
          {/* Recent Completions */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Completions</CardTitle>
            </CardHeader>
            <CardContent>
              {recentCompletions.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  No completions today
                </p>
              ) : (
                <div className="space-y-0">
                  {recentCompletions.slice(0, 5).map((completion) => (
                    <RecentCompletionItem
                      key={completion.taskId}
                      skuCode={completion.skuCode}
                      productName={completion.productName}
                      location={completion.location}
                      completedAt={completion.completedAt}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <button
                  className="w-full flex items-center justify-between p-3 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                  onClick={() => {
                    // Placeholder for warehouse map
                    alert('Warehouse map feature coming soon');
                  }}
                >
                  <span>View Warehouse Map</span>
                  <ArrowRight size={16} className="text-gray-400" />
                </button>
                <button
                  className="w-full flex items-center justify-between p-3 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                  onClick={() => {
                    // Placeholder for location capacity
                    alert('Location capacity feature coming soon');
                  }}
                >
                  <span>Check Location Capacity</span>
                  <ArrowRight size={16} className="text-gray-400" />
                </button>
                <button
                  className="w-full flex items-center justify-between p-3 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                  onClick={() => {
                    // Placeholder for issue reporting
                    alert('Issue reporting feature coming soon');
                  }}
                >
                  <span>Report Location Issue</span>
                  <ArrowRight size={16} className="text-gray-400" />
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Putaway Form Modal */}
      {selectedItem && (
        <PutawayFormModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedItem(null);
          }}
          item={selectedItem}
          onComplete={handleCompletePutaway}
        />
      )}
    </div>
  );
}
