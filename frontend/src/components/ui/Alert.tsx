import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

export interface AlertProps {
  variant?: 'error' | 'warning' | 'success' | 'info';
  title?: string;
  description: React.ReactNode;
  action?: React.ReactNode;
  onClose?: () => void;
}

/**
 * Shared Alert component (Barema F2 requirement):
 * Used across screens and forms to render API error messages (400/404/409),
 * warnings, and contextual feedback.
 */
export const Alert: React.FC<AlertProps> = ({
  variant = 'error',
  title,
  description,
  action,
  onClose,
}) => {
  const icons = {
    error: <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />,
    warning: <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 2 }} />,
    success: <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: 2 }} />,
    info: <Info size={16} style={{ flexShrink: 0, marginTop: 2 }} />,
  };

  return (
    <div className={`alert alert-${variant}`} role="alert">
      <div className="alert-content">
        {icons[variant]}
        <div>
          {title && <div className="alert-title">{title}</div>}
          <div className="alert-description">{description}</div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {action}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'inherit',
              cursor: 'pointer',
              padding: 2,
              display: 'flex',
            }}
            aria-label="Fechar alerta"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
};
