import { MapPin, CheckCircle } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../common/Card';
import Button from '../common/Button';
import Badge from '../common/Badge';

export default function PutawayItemCard({ item, onStartPutaway }) {
  const statusVariant = item.status === 'IN_PROGRESS' ? 'blue' : 'yellow';
  const statusText = item.status === 'IN_PROGRESS' ? 'In Progress' : 'Pending';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Task #{item.id}</CardTitle>
          <Badge variant={statusVariant}>{statusText}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium text-gray-900">{item.productName}</p>
          <p className="text-xs text-gray-500 mt-1">SKU: {item.skuCode}</p>
          <p className="text-xs text-gray-500">Category: {item.category}</p>
          <p className="text-sm text-gray-700 mt-2">
            <span className="font-medium">Quantity:</span> {item.quantity} units
          </p>
        </div>

        {/* Zone Capacity Error */}
        {item.hasError && item.zoneCapacityFull && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-medium text-red-800 mb-1">Zone Capacity Full</p>
                <p className="text-xs text-red-700">{item.errorMessage}</p>
                {item.totalZoneAvailable !== undefined && (
                  <p className="text-xs text-red-600 mt-1">
                    Available: {item.totalZoneAvailable} units
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Suggested Location */}
        {item.suggestedLocation && !item.hasError && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-gray-600 mb-1">Suggested Location (from SKU)</p>
                <p className="text-sm font-semibold text-gray-900">
                  {item.suggestedBinCode || 'N/A'}
                </p>
                {item.suggestedZoneName && (
                  <p className="text-xs text-gray-600 mt-1">{item.suggestedZoneName}</p>
                )}
                {item.availableCapacity !== undefined && (
                  <p className="text-xs text-gray-500 mt-1">
                    Available capacity: {item.availableCapacity} units
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {item.hasOverflow && item.allocationPlan && item.allocationPlan.length > 1 && (
          <div className="p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
            <p className="font-medium mb-1">Multiple bins required:</p>
            <ul className="list-disc list-inside space-y-1">
              {item.allocationPlan.map((alloc, idx) => (
                <li key={idx}>
                  {alloc.quantity} units in {alloc.binCode || `Bin ${alloc.binId}`}
                  {alloc.availableCapacity !== undefined && (
                    <span className="text-blue-600 ml-1">
                      (Avail: {alloc.availableCapacity})
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Capacity Warning */}
        {item.availableCapacity !== undefined && 
         item.availableCapacity < item.quantity && 
         !item.hasOverflow && 
         !item.hasError && (
          <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
            <p className="font-medium">Capacity Warning</p>
            <p>Available: {item.availableCapacity}, Required: {item.quantity}</p>
          </div>
        )}

        <Button
          variant="primary"
          className="w-full"
          onClick={() => onStartPutaway(item)}
        >
          <MapPin size={20} className="mr-2" />
          Start Putaway
        </Button>
      </CardContent>
    </Card>
  );
}
