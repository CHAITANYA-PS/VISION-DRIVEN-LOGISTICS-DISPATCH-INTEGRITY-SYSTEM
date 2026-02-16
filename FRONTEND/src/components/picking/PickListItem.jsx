import { Package, Clock, Truck } from 'lucide-react';
import Card, { CardContent } from '../common/Card';
import Button from '../common/Button';
import Badge from '../common/Badge';
import { Progress } from '../common/Progress';
import { formatPickListId, formatDeadlineTime, calculatePriority, calculateProgress } from '../../utils/pickingUtils';

export default function PickListItem({ pickList, currentUserId, onStartPicking, isDispatched = false }) {
  const progress = calculateProgress(pickList);
  const priority = calculatePriority(pickList.shipmentDeadline);
  // Check if any task in this pick list is assigned to current user
  const isAssigned = pickList.tasks.some(task => 
    task.assignedToUserId && task.assignedToUserId === currentUserId
  );
  // Get assigned worker name from first task (assuming all tasks in a shipment are assigned to same worker)
  const assignedWorkerName = pickList.tasks.find(t => t.assignedToUserId && t.assignedToUserId !== currentUserId)?.assignedToUserName || null;
  
  const pickListId = formatPickListId(pickList.shipmentId);
  const deadlineTime = formatDeadlineTime(pickList.shipmentDeadline);
  
  const priorityVariant = priority === "High" ? "red" : "yellow";

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold text-gray-900">{pickListId}</h3>
              <Badge variant={priorityVariant}>{priority}</Badge>
            </div>
            <div className="space-y-1 text-sm text-gray-600">
              <p><span className="font-medium">Destination:</span> {pickList.destination || "N/A"}</p>
              <p><span className="font-medium">Order:</span> {pickList.orderNumber || "N/A"}</p>
              <div className="flex items-center gap-1">
                <Clock size={14} />
                <span>Deadline: {deadlineTime}</span>
              </div>
              {!isAssigned && assignedWorkerName && (
                <p className="text-xs text-gray-500">Assigned to: {assignedWorkerName}</p>
              )}
            </div>
          </div>
        </div>
        
        <div className="mb-3">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-600">Progress</span>
            <span className="font-medium text-gray-900">{progress.picked}/{progress.total} items</span>
          </div>
          <Progress value={progress.percentage} className="h-2" />
        </div>
        
        {isDispatched ? (
          <div className="w-full p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-center gap-2">
            <Truck size={18} className="text-green-600" />
            <span className="text-green-700 font-medium">Ready to Ship</span>
          </div>
        ) : (
          <Button
            variant={isAssigned ? "primary" : "outline"}
            className="w-full"
            onClick={() => onStartPicking(pickList)}
            disabled={!isAssigned}
          >
            <Package size={18} className="mr-2" />
            {isAssigned ? "Start Picking" : "Assigned to Another Worker"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

