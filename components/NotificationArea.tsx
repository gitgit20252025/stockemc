
import React from 'react';
import { AppNotification, NotificationType } from '../types';
import { CheckCircleIcon, XCircleIcon, InfoCircleIcon, AlertTriangleIcon, CloseIcon } from './icons';

interface NotificationAreaProps {
  notifications: AppNotification[];
  onRemoveNotification: (id: string) => void;
}

const NotificationIcon: React.FC<{ type: NotificationType; className?: string }> = ({ type, className }) => {
  const iconProps = { className: `w-6 h-6 ${className}` };
  switch (type) {
    case 'success':
      return <CheckCircleIcon {...iconProps} />;
    case 'error':
      return <XCircleIcon {...iconProps} />;
    case 'info':
      return <InfoCircleIcon {...iconProps} />;
    case 'warning':
      return <AlertTriangleIcon {...iconProps} />;
    default: // Should not happen with defined types, but good fallback
      return <AlertTriangleIcon {...iconProps} />;
  }
};

const NotificationArea: React.FC<NotificationAreaProps> = ({ notifications, onRemoveNotification }) => {
  if (notifications.length === 0) {
    return null;
  }

  const typeClasses: Record<NotificationType, { bg: string; text: string; iconText: string; ringFocus: string }> = {
    success: { bg: 'bg-success-50', text: 'text-success-800', iconText: 'text-success-500', ringFocus: 'focus:ring-offset-success-50 focus:ring-success-600' },
    error: { bg: 'bg-danger-50', text: 'text-danger-800', iconText: 'text-danger-500', ringFocus: 'focus:ring-offset-danger-50 focus:ring-danger-600' },
    info: { bg: 'bg-primary-50', text: 'text-primary-800', iconText: 'text-primary-500', ringFocus: 'focus:ring-offset-primary-50 focus:ring-primary-600' },
    warning: { bg: 'bg-warning-50', text: 'text-warning-800', iconText: 'text-warning-500', ringFocus: 'focus:ring-offset-warning-50 focus:ring-warning-600' },
  };

  return (
    <div className="fixed bottom-5 right-5 space-y-3 z-[200] w-full max-w-sm">
      {notifications.map(notification => {
        const classes = typeClasses[notification.type];
        return (
          <div
            key={notification.id}
            className={`${classes.bg} ${classes.text} p-4 rounded-md shadow-lg flex items-start transition-all duration-300 ease-in-out transform`}
            role="alert"
          >
            <div className="flex-shrink-0">
              <NotificationIcon type={notification.type} className={classes.iconText} />
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium">{notification.message}</p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => onRemoveNotification(notification.id)}
                className={`-mx-1.5 -my-1.5 ${classes.bg} rounded-md p-1.5 ${classes.text} hover:bg-opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2 ${classes.ringFocus}`}
              >
                <span className="sr-only">Dismiss</span>
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default NotificationArea;