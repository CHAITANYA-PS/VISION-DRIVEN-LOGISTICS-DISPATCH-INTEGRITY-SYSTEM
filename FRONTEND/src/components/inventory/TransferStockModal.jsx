import { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';
import Alert from '../common/Alert';
import { getAllZones } from '../../services/zoneService';
import { getRacksByZone } from '../../services/rackService';
import { getBinsByRack } from '../../services/binService';

export default function TransferStockModal({ isOpen, onClose, onTransfer, stock }) {
  const [zones, setZones] = useState([]);
  const [racks, setRacks] = useState([]);
  const [bins, setBins] = useState([]);
  const [selectedZone, setSelectedZone] = useState('');
  const [selectedRack, setSelectedRack] = useState('');
  const [selectedBin, setSelectedBin] = useState('');
  const [quantity, setQuantity] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingZones, setLoadingZones] = useState(false);
  const [loadingRacks, setLoadingRacks] = useState(false);
  const [loadingBins, setLoadingBins] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchZones();
      setQuantity('');
      setSelectedZone('');
      setSelectedRack('');
      setSelectedBin('');
      setRacks([]);
      setBins([]);
    }
  }, [isOpen]);

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
    setLoadingZones(true);
    try {
      const data = await getAllZones();
      setZones(data);
    } catch (err) {
      setError('Failed to load zones');
    } finally {
      setLoadingZones(false);
    }
  };

  const fetchRacks = async () => {
    setLoadingRacks(true);
    try {
      const data = await getRacksByZone(parseInt(selectedZone));
      setRacks(data);
      setBins([]);
      setSelectedRack('');
      setSelectedBin('');
    } catch (err) {
      setError('Failed to load racks');
    } finally {
      setLoadingRacks(false);
    }
  };

  const fetchBins = async () => {
    setLoadingBins(true);
    try {
      const data = await getBinsByRack(parseInt(selectedRack));
      setBins(data);
      setSelectedBin('');
    } catch (err) {
      setError('Failed to load bins');
    } finally {
      setLoadingBins(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!selectedBin || !quantity) {
      setError('Please select destination bin and enter quantity');
      return;
    }

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) {
      setError('Quantity must be a positive number');
      return;
    }

    if (qty > stock.quantity) {
      setError(`Quantity cannot exceed available stock (${stock.quantity})`);
      return;
    }

    if (parseInt(selectedBin) === stock.binId) {
      setError('Destination bin must be different from source bin');
      return;
    }

    setLoading(true);
    try {
      await onTransfer({
        fromBinId: stock.binId,
        toBinId: parseInt(selectedBin),
        skuId: stock.skuId,
        quantity: qty,
      });
      onClose();
      setQuantity('');
      setSelectedZone('');
      setSelectedRack('');
      setSelectedBin('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to transfer stock');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setQuantity('');
    setSelectedZone('');
    setSelectedRack('');
    setSelectedBin('');
    setError('');
    onClose();
  };

  if (!stock) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Transfer Stock" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert variant="error">{error}</Alert>}

        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
          <h3 className="font-semibold text-gray-900">Current Location</h3>
          <p className="text-sm text-gray-600">
            <strong>SKU:</strong> {stock.skuCode} ({stock.productName})
          </p>
          <p className="text-sm text-gray-600">
            <strong>Location:</strong> {stock.zoneName} → {stock.rackName} → {stock.binName} ({stock.binCode})
          </p>
          <p className="text-sm text-gray-600">
            <strong>Available Quantity:</strong> {stock.quantity}
          </p>
        </div>

        <div className="border-t pt-4">
          <h3 className="font-semibold text-gray-900 mb-4">Destination Location</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Zone"
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              disabled={loadingZones}
              options={[
                { value: '', label: 'Select a zone' },
                ...zones.map((z) => ({
                  value: z.id.toString(),
                  label: z.name,
                })),
              ]}
            />

            <Select
              label="Rack"
              value={selectedRack}
              onChange={(e) => setSelectedRack(e.target.value)}
              disabled={!selectedZone || loadingRacks}
              options={[
                { value: '', label: 'Select a rack' },
                ...racks.map((r) => ({
                  value: r.id.toString(),
                  label: r.name,
                })),
              ]}
            />

            <Select
              label="Bin"
              value={selectedBin}
              onChange={(e) => setSelectedBin(e.target.value)}
              disabled={!selectedRack || loadingBins}
              options={[
                { value: '', label: 'Select a bin' },
                ...bins.map((b) => ({
                  value: b.id.toString(),
                  label: `${b.name}${b.code ? ` (${b.code})` : ''}`,
                })),
              ]}
            />
          </div>
        </div>

        <div>
          <Input
            label="Quantity to Transfer"
            type="number"
            min="1"
            max={stock.quantity}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
            placeholder={`Max: ${stock.quantity}`}
          />
        </div>

        <div className="flex gap-3 justify-end pt-4">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={loading || !selectedBin || !quantity}>
            {loading ? 'Transferring...' : 'Transfer Stock'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}







