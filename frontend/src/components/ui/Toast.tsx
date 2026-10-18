import React, { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle2, Info, X, XCircle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
}

export interface ShowToastOptions {
  title: string;
  description?: string;
  type?: ToastType;
}

interface ToastContextValue {
  showToast: (
    titleOrOptions: string | ShowToastOptions,
    typeOrDescription?: ToastType | string,
    maybeType?: ToastType
  ) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (
      titleOrOptions: string | ShowToastOptions,
      typeOrDescription?: ToastType | string,
      maybeType?: ToastType
    ) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

      let title = '';
      let description: string | undefined;
      let type: ToastType = 'success';

      if (typeof titleOrOptions === 'object') {
        title = titleOrOptions.title;
        description = titleOrOptions.description;
        type = titleOrOptions.type ?? 'success';
      } else {
        title = titleOrOptions;
        if (
          typeOrDescription === 'success' ||
          typeOrDescription === 'error' ||
          typeOrDescription === 'info'
        ) {
          type = typeOrDescription;
        } else if (typeof typeOrDescription === 'string') {
          description = typeOrDescription;
          type = maybeType ?? 'success';
        }
      }

      setToasts((prev) => [...prev, { id, type, title, description }]);
      setTimeout(() => {
        removeToast(id);
      }, 4500);
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toasts.length > 0 && (
        <div className="toast-viewport" role="region" aria-label="Notificações">
          {toasts.map((toast) => (
            <div key={toast.id} className={`toast-item toast-${toast.type}`}>
              <div className="toast-icon-wrap">
                {toast.type === 'success' ? (
                  <CheckCircle2 size={16} className="toast-icon-success" />
                ) : toast.type === 'error' ? (
                  <XCircle size={16} className="toast-icon-error" />
                ) : (
                  <Info size={16} className="toast-icon-info" />
                )}
              </div>

              <div className="toast-content">
                <div className="toast-title">{toast.title}</div>
                {toast.description && (
                  <div className="toast-description">{toast.description}</div>
                )}
              </div>

              <button
                type="button"
                className="toast-close-btn"
                onClick={() => removeToast(toast.id)}
                aria-label="Fechar notificação"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
};

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast deve ser utilizado dentro de um ToastProvider');
  }
  return ctx;
}
