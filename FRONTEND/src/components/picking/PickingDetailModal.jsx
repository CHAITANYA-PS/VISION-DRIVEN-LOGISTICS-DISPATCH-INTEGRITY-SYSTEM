import { useState, useEffect } from 'react';
import { Package, MapPin, CheckCircle, Truck } from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Badge from '../common/Badge';
import Alert from '../common/Alert';
import { formatPickListId } from '../../utils/pickingUtils';

export default function PickingDetailModal({ isOpen, onClose, pickList, onComplete, onRefresh }) {
  const [selectedTaskIds, setSelectedTaskIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentPickList, setCurrentPickList] = useState(pickList);

  // Update currentPickList when pickList prop changes (after refresh)
  useEffect(() => {
    if (pickList) {
      setCurrentPickList(pickList);
      // Clear selection of dispatched items
      setSelectedTaskIds(prev => {
        // Filter out tasks that are now completed/dispatched
        return prev.filter(taskId => {
          const task = pickList.tasks.find(t => t.id === taskId);
          return task && task.status !== 'COMPLETED' && task.status !== 'DISPATCHED';
        });
      });
    }
  }, [pickList]);

  if (!currentPickList) return null;

  const pickListId = formatPickListId(currentPickList.shipmentId);
  const totalItems = currentPickList.tasks.length;
  const pickedCount = currentPickList.tasks.filter(t => t.status === 'COMPLETED' || t.status === 'DISPATCHED').length;
  
  // Get only pending/in-progress tasks that can be selected
  const availableTasks = currentPickList.tasks.filter(t => 
    t.status !== 'COMPLETED' && t.status !== 'DISPATCHED'
  );

  const handleToggleSelection = (taskId) => {
    setSelectedTaskIds(prev => 
      prev.includes(taskId)
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
    setError(''); // Clear error when selection changes
  };

  const handleSelectAll = () => {
    const allAvailableIds = availableTasks.map(t => t.id);
    setSelectedTaskIds(allAvailableIds);
    setError('');
  };

  const handleDeselectAll = () => {
    setSelectedTaskIds([]);
    setError('');
  };

  const handleDispatch = async () => {
    if (selectedTaskIds.length === 0) {
      setError('Please select at least one item to dispatch');
      return;
    }

    // Check for items with insufficient stock before dispatching
    const insufficientStockTasks = selectedTaskIds
      .map(taskId => currentPickList.tasks.find(t => t.id === taskId))
      .filter(task => task && task.hasInsufficientStock);
    
    if (insufficientStockTasks.length > 0) {
      const taskNames = insufficientStockTasks.map(t => 
        `${t.productName} (${t.skuCode}): Available ${t.availableStock || 0}, Required ${t.quantity}`
      ).join('\n');
      setError(`Cannot dispatch items with insufficient stock:\n${taskNames}\n\nPlease check inventory or contact supervisor.`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const failedTasks = [];
      
      // Dispatch each selected task
      for (const taskId of selectedTaskIds) {
        try {
          await onComplete(taskId);
        } catch (err) {
          // Log error for debugging
          console.error(`Failed to dispatch task ${taskId}:`, err);
          console.error('Error response data:', err.response?.data);
          // Find the task details for better error message
          const task = currentPickList.tasks.find(t => t.id === taskId);
          const taskName = task ? `${task.productName} (${task.skuCode})` : `Task ${taskId}`;
          failedTasks.push({ taskId, taskName, error: err });
        }
      }
      
      // Refresh data regardless of success/failure to update UI
      if (onRefresh) {
        await onRefresh();
        // After refresh, the pickList prop will be updated by parent
        // The useEffect will update currentPickList automatically
      }
      
      if (failedTasks.length > 0) {
        // Some tasks failed
        const errorMessages = failedTasks.map(ft => {
          const errorMsg = ft.error?.response?.data?.message || 
                          ft.error?.response?.data?.error || 
                          ft.error?.message || 
                          'Unknown error';
          return `${ft.taskName}: ${errorMsg}`;
        });
        setError(`Failed to dispatch ${failedTasks.length} item(s):\n${errorMessages.join('\n')}`);
        // Clear selection of failed items so user can retry
        const failedTaskIds = failedTasks.map(ft => ft.taskId);
        setSelectedTaskIds(prev => prev.filter(id => !failedTaskIds.includes(id)));
      } else {
        // All tasks succeeded
        setSelectedTaskIds([]);
        onClose();
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.error || 
                          err.message || 
                          'Failed to dispatch items';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Picking: ${pickListId}`} size="lg">
      <div className="space-y-6">
        {error && (
          <Alert variant="error" onClose={() => setError('')}>
            <div className="whitespace-pre-line">{error}</div>
          </Alert>
        )}

        {/* Pick List Info */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-900">{pickListId}</h3>
            <Badge variant="blue">{pickedCount}/{totalItems} Picked</Badge>
          </div>
          <p className="text-sm text-gray-600">
            {currentPickList.destination && `Destination: ${currentPickList.destination}`}
            {currentPickList.orderNumber && ` • Order: ${currentPickList.orderNumber}`}
          </p>
        </div>

        {/* Items to Pick */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-900">Items to Pick</h4>
            {availableTasks.length > 0 && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Select All
                </button>
                {selectedTaskIds.length > 0 && (
                  <>
                    <span className="text-xs text-gray-400">|</span>
                    <button
                      type="button"
                      onClick={handleDeselectAll}
                      className="text-xs text-gray-600 hover:text-gray-800"
                    >
                      Deselect All
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {currentPickList.tasks.map((task) => {
              const isCompleted = task.status === 'COMPLETED' || task.status === 'DISPATCHED';
              const isSelected = selectedTaskIds.includes(task.id);
              const isAvailable = !isCompleted;
              
              return (
                <div
                  key={task.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    isCompleted
                      ? 'bg-green-50 border-green-200 cursor-not-allowed'
                      : task.hasInsufficientStock
                      ? 'bg-red-50 border-red-300'
                      : isSelected
                      ? 'bg-blue-50 border-blue-300'
                      : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => isAvailable && !task.hasInsufficientStock && handleToggleSelection(task.id)}
                >
                  <div className="flex items-start gap-3">
                    {isAvailable && !task.hasInsufficientStock && (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelection(task.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        disabled={task.hasInsufficientStock}
                      />
                    )}
                    {isAvailable && task.hasInsufficientStock && (
                      <div className="mt-1 h-4 w-4 flex items-center justify-center text-red-600">
                        ⚠️
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900">{task.productName || 'N/A'}</span>
                        {isCompleted && <CheckCircle className="w-4 h-4 text-green-600" />}
                        {isSelected && !isCompleted && <CheckCircle className="w-4 h-4 text-blue-600" />}
                      </div>
                      <p className="text-xs text-gray-600">SKU: {task.skuCode}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-gray-600">Required: {task.quantity}</p>
                        {task.availableStock !== undefined && task.availableStock !== null && (
                          <p className={`text-xs font-medium ${
                            task.hasInsufficientStock 
                              ? 'text-red-600' 
                              : 'text-green-600'
                          }`}>
                            Available: {task.availableStock}
                          </p>
                        )}
                      </div>
                      {task.hasInsufficientStock && !isCompleted && (
                        <p className="text-xs text-red-600 font-medium mt-1">
                          ⚠️ Insufficient stock in suggested location
                        </p>
                      )}
                      {task.suggestedLocation && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-gray-600">
                          <MapPin size={12} />
                          <span>{task.suggestedLocation}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dispatch Section */}
        {availableTasks.length > 0 && (
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-600">
                {selectedTaskIds.length > 0 
                  ? `${selectedTaskIds.length} item(s) selected for dispatch`
                  : 'Select items to dispatch'}
              </span>
            </div>
            <Button
              variant="primary"
              className="w-full"
              onClick={handleDispatch}
              disabled={loading || selectedTaskIds.length === 0}
            >
              <Truck size={18} className="mr-2" />
              {loading ? 'Dispatching...' : 'Dispatch Selected'}
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}

