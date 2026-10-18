import React from 'react';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options?: SelectOption[];
  hasError?: boolean;
  placeholder?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    { options, hasError = false, placeholder, children, className = '', ...props },
    ref
  ) => {
    return (
      <select
        ref={ref}
        className={`select ${hasError ? 'input-error' : ''} ${className}`.trim()}
        {...props}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options
          ? options.map((opt) => (
              <option key={String(opt.value)} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))
          : children}
      </select>
    );
  }
);

Select.displayName = 'Select';
