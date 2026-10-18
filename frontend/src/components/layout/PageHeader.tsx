import React from 'react';

interface PageHeaderProps {
  icon?: React.ReactNode;
  iconVariant?: 'primary' | 'neutral';
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  icon,
  iconVariant = 'primary',
  title,
  subtitle,
  actions,
}) => {
  return (
    <div className="page-header">
      <div className="page-header-left">
        {icon && (
          <div
            className={`page-header-icon-box ${
              iconVariant === 'neutral' ? 'neutral' : ''
            }`.trim()}
          >
            {icon}
          </div>
        )}
        <div>
          <h1 className="page-header-title">{title}</h1>
          {subtitle && <div className="page-header-subtitle">{subtitle}</div>}
        </div>
      </div>
      {actions && <div className="page-header-actions">{actions}</div>}
    </div>
  );
};
