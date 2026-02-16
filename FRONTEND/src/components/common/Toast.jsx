import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../utils/helpers';

const iconMap = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: AlertCircle,
};

const variantStyles = {
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-800',
    iconColor: 'text-blue-600',
  },
  success: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-800',
    iconColor: 'text-green-600',
  },
  warning: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    text: 'text-yellow-800',
    iconColor: 'text-yellow-600',
  },
  error: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-800',
    iconColor: 'text-red-600',
  },
};

export default function Toast({ id, title, message, type = 'info', onClose, link, autoDismiss = true, duration = 6000 }) {
  const navigate = useNavigate();
  const styles = variantStyles[type] || variantStyles.info;
  const Icon = iconMap[type] || Info;

  useEffect(() => {
    if (autoDismiss) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [autoDismiss, duration, onClose]);

  const handleClick = () => {
    if (link) {
      navigate(link);
      onClose();
    }
  };

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 rounded-lg border shadow-lg min-w-[320px] max-w-[420px]',
        'animate-in slide-in-from-right-full duration-300',
        styles.bg,
        styles.border,
        styles.text,
        link && 'cursor-pointer hover:shadow-xl transition-shadow'
      )}
      onClick={handleClick}
    >
      <Icon className={cn('w-5 h-5 flex-shrink-0 mt-0.5', styles.iconColor)} />
      <div className="flex-1 min-w-0">
        {title && <h4 className="font-semibold text-sm mb-1">{title}</h4>}
        <p className="text-sm">{message}</p>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className={cn(
          'flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity',
          styles.text
        )}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}





