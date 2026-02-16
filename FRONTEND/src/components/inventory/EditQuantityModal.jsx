import { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import Alert from '../common/Alert';

export default function EditQuantityModal({ isOpen, onClose, onSave, currentQuantity, stockId }) {
  const [quantity, setQuantity] = useState(currentQuantity?.toString() || '0');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty < 0) {
      setError('Quantity must be a non-negative number');
      return;
    }

    setLoading(true);
    try {
      await onSave(stockId, qty);
      onClose();
      setQuantity('0');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update quantity');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setQuantity(currentQuantity?.toString() || '0');
    setError('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Edit Quantity" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert variant="error">{error}</Alert>}
        
        <div>
          <Input
            label="Quantity"
            type="number"
            min="0"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
            placeholder="Enter quantity"
          />
          <p className="text-sm text-gray-500 mt-1">
            Current quantity: {currentQuantity || 0}
          </p>
        </div>

        <div className="flex gap-3 justify-end pt-4">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? 'Updating...' : 'Update Quantity'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}







