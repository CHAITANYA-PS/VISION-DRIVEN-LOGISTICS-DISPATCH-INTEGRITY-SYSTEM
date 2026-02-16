import { X } from 'lucide-react';
import Input from '../common/Input';
import Button from '../common/Button';

export default function PackageInputRow({
  pkg,
  index,
  skus,
  onChange,
  onRemove,
}) {
  // Defensive defaults to avoid runtime errors if pkg/skus are undefined
  const current = pkg || { skuId: '', quantity: '' };
  const skuList = Array.isArray(skus) ? skus : [];

  return (
    <div className="flex gap-3 items-start">
      <div className="flex-1">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          SKU
        </label>
        <select
          value={current.skuId ? String(current.skuId) : ''}
          onChange={(e) => onChange(index, 'skuId', e.target.value)}
          className="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 outline-none"
          required
        >
          <option value="">Select SKU</option>
          {skuList.map((sku) => (
            <option key={sku.id} value={String(sku.id)}>
              {sku.skuCode} - {sku.productName || 'Unknown Product'}
            </option>
          ))}
        </select>
      </div>
      
      <div className="w-32">
        <Input
          label="Quantity"
          type="number"
          min="1"
          value={current.quantity || ''}
          onChange={(e) =>
            onChange(index, 'quantity', e.target.value)
          }
          placeholder="Qty"
          required
        />
      </div>

      <div className="pt-7">
        <Button
          type="button"
          variant="danger"
          size="sm"
          onClick={() => onRemove(index)}
        >
          <X size={16} />
        </Button>
      </div>
    </div>
  );
}
