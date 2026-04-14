import React, { useEffect } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

export interface NotificationProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  /** Si no se envía, se asume visible (compat. con usos que solo montan/desmontan el componente). */
  isVisible?: boolean;
  onClose: () => void;
  duration?: number;
}

const NotificationView: React.FC<NotificationProps> = ({
  type,
  message,
  isVisible = true,
  onClose,
  duration = 5000
}) => {
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5" />;
      case 'error':
        return <XCircle className="w-5 h-5" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5" />;
      case 'info':
        return <Info className="w-5 h-5" />;
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  const getStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  return (
    <div className={`fixed top-4 right-4 z-[100] max-w-sm w-full pointer-events-auto`}>
      <div className={`border rounded-lg p-4 shadow-lg ${getStyles()}`}>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            {getIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">{message}</p>
          </div>
          <div className="flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

function pushToast(type: NotificationProps['type'], message: string) {
  const wrap = document.createElement('div');
  wrap.style.position = 'fixed';
  wrap.style.top = '0';
  wrap.style.left = '0';
  wrap.style.right = '0';
  wrap.style.bottom = '0';
  wrap.style.pointerEvents = 'none';
  wrap.style.zIndex = '9999';
  document.body.appendChild(wrap);

  const root: Root = createRoot(wrap);
  const close = () => {
    try {
      root.unmount();
    } catch {
      /* ignore */
    }
    wrap.remove();
  };

  root.render(
    <NotificationView
      type={type}
      message={message}
      isVisible={true}
      onClose={close}
      duration={5000}
    />
  );
}

type NotificationWithStatic = React.FC<NotificationProps> & {
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
};

export const Notification = Object.assign(NotificationView, {
  success: (message: string) => pushToast('success', message),
  error: (message: string) => pushToast('error', message),
  warning: (message: string) => pushToast('warning', message),
  info: (message: string) => pushToast('info', message)
}) as NotificationWithStatic;
