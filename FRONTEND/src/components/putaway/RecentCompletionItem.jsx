import { CheckCircle } from 'lucide-react';

export default function RecentCompletionItem({ skuCode, productName, location, completedAt }) {
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    return `${displayHours}:${displayMinutes} ${ampm}`;
  };

  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-200 last:border-b-0">
      <div className="flex items-center gap-3 flex-1">
        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{productName}</p>
          <p className="text-xs text-gray-500">{skuCode}</p>
          <p className="text-xs text-gray-600 mt-1">Location: {location}</p>
        </div>
      </div>
      <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
        {formatTime(completedAt)}
      </span>
    </div>
  );
}
