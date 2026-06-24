import React from 'react';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';

type AlertType = 'success' | 'error' | 'warning' | 'info';

interface AlertProps {
  type: AlertType;
  title: string;
  message?: string;
  onClose?: () => void;
  dismissible?: boolean;
  className?: string;
}

const getAlertStyles = (type: AlertType): Record<string, string> => {
  const styles: Record<AlertType, Record<string, string>> = {
    success: {
      container: 'bg-green-50 border border-green-200',
      icon: 'text-green-600',
      title: 'text-green-900',
      message: 'text-green-800',
    },
    error: {
      container: 'bg-red-50 border border-red-200',
      icon: 'text-red-600',
      title: 'text-red-900',
      message: 'text-red-800',
    },
    warning: {
      container: 'bg-yellow-50 border border-yellow-200',
      icon: 'text-yellow-600',
      title: 'text-yellow-900',
      message: 'text-yellow-800',
    },
    info: {
      container: 'bg-blue-50 border border-blue-200',
      icon: 'text-blue-600',
      title: 'text-blue-900',
      message: 'text-blue-800',
    },
  };
  return styles[type];
};

const getAlertIcon = (type: AlertType) => {
  switch (type) {
    case 'success':
      return <CheckCircle className="w-5 h-5" />;
    case 'error':
      return <AlertCircle className="w-5 h-5" />;
    case 'warning':
      return <AlertCircle className="w-5 h-5" />;
    case 'info':
      return <Info className="w-5 h-5" />;
  }
};

export const Alert: React.FC<AlertProps> = ({
  type,
  title,
  message,
  onClose,
  dismissible = false,
  className = '',
}) => {
  const styles = getAlertStyles(type);

  return (
    <div
      className={`${styles.container} rounded-lg p-4 flex gap-3 ${className}`}
      role="alert"
      aria-live={type === 'error' ? 'assertive' : 'polite'}
    >
      {/* Icon */}
      <div className={`flex-shrink-0 ${styles.icon} mt-0.5`}>{getAlertIcon(type)}</div>

      {/* Content */}
      <div className="flex-1">
        <h3 className={`font-semibold ${styles.title}`}>{title}</h3>
        {message && <p className={`text-sm mt-1 ${styles.message}`}>{message}</p>}
      </div>

      {/* Close Button */}
      {dismissible && (
        <button
          onClick={onClose}
          className={`flex-shrink-0 ${styles.icon} hover:opacity-70 transition-opacity`}
          aria-label="Close alert"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};
