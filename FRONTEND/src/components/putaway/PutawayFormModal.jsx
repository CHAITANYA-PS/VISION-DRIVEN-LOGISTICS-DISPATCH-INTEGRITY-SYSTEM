import { useState, useEffect } from 'react';
import { CheckCircle } from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';
import Alert from '../common/Alert';
import { getAllZones } from '../../services/zoneService';
import { getRacksByZone } from '../../services/rackService';
import { getBinsByRack } from '../../services/binService';

export default function PutawayFormModal({ isOpen, onClose, item, onComplete }) {
  const [zones, setZones] = useState([]);
  const [racks, setRacks] = useState([]);
  const [bins, setBins] = useState([]);
  const [selectedZone, setSelectedZone] = useState('');
  const [selectedRack, setSelectedRack] = useState('');
  const [selectedBin, setSelectedBin] = useState('');
  const [quantity, setQuantity] = useState(item?.quantity || 1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && item) {
      // Auto-populate with suggested location from SKU's initial location
      if (item.suggestedZoneId) {
        setSelectedZone(item.suggestedZoneId.toString());
      }
      setQuantity(item.quantity || 1);
      fetchZones();
    }
  }, [isOpen, item]);

  useEffect(() => {
    if (selectedZone) {
      fetchRacks();
    } else {
      setRacks([]);
      setBins([]);
      setSelectedRack('');
      setSelectedBin('');
    }
  }, [selectedZone]);

  useEffect(() => {
    if (selectedRack) {
      fetchBins();
    } else {
      setBins([]);
      setSelectedBin('');
    }
  }, [selectedRack]);

  const fetchZones = async () => {
    try {
      const data = await getAllZones();
      setZones(data);
    } catch (err) {
      setError('Failed to load zones');
    }
  };

  const fetchRacks = async () => {
    try {
      const data = await getRacksByZone(parseInt(selectedZone));
      setRacks(data);
      // Auto-select the rack that contains the suggested bin
      if (item?.suggestedBinId && data.length > 0) {
        // Find the rack that contains the suggested bin by fetching bins for each rack
        for (const rack of data) {
          try {
            const bins = await getBinsByRack(rack.id);
            const suggestedBin = bins.find(b => b.id === item.suggestedBinId);
            if (suggestedBin) {
              setSelectedRack(rack.id.toString());
              setBins(bins);
              setSelectedBin(item.suggestedBinId.toString());
              break;
            }
          } catch (err) {
            // Continue to next rack
          }
        }
      }
    } catch (err) {
      setError('Failed to load racks');
    }
  };

  const fetchBins = async () => {
    try {
      const data = await getBinsByRack(parseInt(selectedRack));
      setBins(data);
      // Pre-select suggested bin if available
      if (item?.suggestedBinId) {
        const suggestedBin = data.find(b => b.id === item.suggestedBinId);
        if (suggestedBin) {
          setSelectedBin(item.suggestedBinId.toString());
        }
      }
    } catch (err) {
      setError('Failed to load bins');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!selectedBin || !quantity || quantity <= 0) {
      setError('Please select a bin and enter a valid quantity');
      return;
    }

    setLoading(true);
    try {
      // Check if we need to use allocation plan
      if (item?.hasOverflow && item?.allocationPlan && item.allocationPlan.length > 1) {
        // Use multi-bin allocation
        const allocations = item.allocationPlan.map(alloc => ({
          binId: alloc.binId,
          quantity: alloc.quantity
        }));
        await onComplete(item.id, null, null, allocations);
      } else if (item.suggestedBinId && !item.hasError) {
        // Use suggested bin from SKU's initial location
        await onComplete(item.id, item.suggestedBinId, parseInt(quantity), null);
      } else {
        // Single bin allocation (manual selection)
        await onComplete(item.id, parseInt(selectedBin), parseInt(quantity), null);
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to complete putaway');
    } finally {
      setLoading(false);
    }
  };

  if (!item) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Putaway: ${item.productName}`} size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <Alert variant="error" onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-gray-600">Shipment Item ID</p>
          <p className="font-semibold text-gray-900">#{item.shipmentItemId}</p>
          <p className="text-sm text-gray-600 mt-2">SKU: {item.skuCode}</p>
        </div>

        {/* Zone Capacity Error */}
        {item.hasError && item.zoneCapacityFull && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm font-medium text-red-800 mb-2">
              Zone Capacity Full
            </p>
            <p className="text-sm text-red-700 mb-2">{item.errorMessage}</p>
            {item.totalZoneCapacity !== undefined && (
              <div className="text-xs text-red-600 space-y-1">
                <p>Zone Capacity: {item.totalZoneCapacity}</p>
                <p>Available: {item.totalZoneAvailable || 0}</p>
                <p className="font-medium mt-2">
                  Please request bin location allocation from supervisor.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Capacity Warning */}
        {item.availableCapacity !== undefined && item.availableCapacity < item.quantity && !item.hasOverflow && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm font-medium text-yellow-800 mb-2">
              Capacity Warning
            </p>
            <p className="text-sm text-yellow-700">
              Available capacity: {item.availableCapacity} units, Required: {item.quantity} units
            </p>
          </div>
        )}

        {/* Multi-bin Allocation Plan */}
        {item.hasOverflow && item.allocationPlan && item.allocationPlan.length > 1 && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm font-medium text-blue-800 mb-2">
              Multiple bins required due to capacity:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-blue-700">
              {item.allocationPlan.map((alloc, idx) => (
                <li key={idx}>
                  {alloc.quantity} units → {alloc.binCode || `Bin ${alloc.binId}`}
                  {alloc.availableCapacity !== undefined && (
                    <span className="text-xs text-blue-600 ml-2">
                      (Available: {alloc.availableCapacity})
                    </span>
                  )}
                </li>
              ))}
            </ul>
            <p className="text-xs text-blue-600 mt-2">
              The system will automatically allocate to these bins based on SKU's initial location.
            </p>
          </div>
        )}

        {/* Suggested Location Info */}
        {item.suggestedLocation && !item.hasError && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-xs text-gray-600 mb-1">Suggested Location (from SKU management)</p>
            <p className="text-sm font-semibold text-gray-900">{item.suggestedLocation}</p>
            {item.suggestedZoneName && (
              <p className="text-xs text-gray-600 mt-1">Zone: {item.suggestedZoneName}</p>
            )}
          </div>
        )}

        <div className="space-y-4">
          {/* Show location fields as read-only when suggested location exists and no error */}
          {item.suggestedLocation && !item.hasError ? (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Zone</label>
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700">
                  {item.suggestedZoneName || 'N/A'}
                </div>
              </div>
              {item.suggestedRackName && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Rack</label>
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700">
                    {item.suggestedRackName}
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Bin</label>
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700">
                  {item.suggestedBinCode || item.suggestedBinId || 'N/A'}
                </div>
                <p className="text-xs text-gray-500">
                  Location is locked to SKU's initial assignment. Quantity will be added to existing stock.
                </p>
              </div>
            </>
          ) : (
            <>
              <Select
                label="Select Zone"
                value={selectedZone}
                onChange={(e) => {
                  setSelectedZone(e.target.value);
                  setSelectedRack('');
                  setSelectedBin('');
                }}
                disabled={item.hasOverflow && item.allocationPlan && item.allocationPlan.length > 1}
                options={[
                  { value: '', label: 'Select a zone' },
                  ...zones.map((z) => ({ value: z.id.toString(), label: z.name })),
                ]}
              />

              {selectedZone && (
                <Select
                  label="Select Rack"
                  value={selectedRack}
                  onChange={(e) => {
                    setSelectedRack(e.target.value);
                    setSelectedBin('');
                  }}
                  disabled={item.hasOverflow && item.allocationPlan && item.allocationPlan.length > 1}
                  options={[
                    { value: '', label: 'Select a rack' },
                    ...racks.map((r) => ({ value: r.id.toString(), label: r.name })),
                  ]}
                />
              )}

              {selectedRack && (
                <Select
                  label="Select Bin"
                  value={selectedBin}
                  onChange={(e) => setSelectedBin(e.target.value)}
                  disabled={item.hasOverflow && item.allocationPlan && item.allocationPlan.length > 1}
                  options={[
                    { value: '', label: 'Select a bin' },
                    ...bins.map((b) => ({
                      value: b.id.toString(),
                      label: `${b.name}${b.code ? ` (${b.code})` : ''}`,
                    })),
                  ]}
                />
              )}
            </>
          )}

          <Input
            label="Quantity"
            type="number"
            min="1"
            max={item.quantity}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
            disabled={
              (item.hasOverflow && item.allocationPlan && item.allocationPlan.length > 1) ||
              item.hasError ||
              (item.suggestedLocation && !item.hasError)
            }
          />
        </div>

        <div className="flex gap-4 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={
              (!selectedBin && !item.suggestedBinId) || 
              !quantity || 
              loading || 
              item.hasError
            }
            className="flex-1"
          >
            <CheckCircle size={20} className="mr-2" />
            {loading ? 'Completing...' : 'Complete Putaway'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
