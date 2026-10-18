import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
  leftIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ hasError = false, leftIcon, className = '', ...props }, ref) => {
    const inputElement = (
      <input
        ref={ref}
        className={`input ${hasError ? 'input-error' : ''} ${className}`.trim()}
        {...props}
      />
    );

    if (leftIcon) {
      return (
        <div className="input-with-icon">
          <span className="input-icon-left">{leftIcon}</span>
          {inputElement}
        </div>
      );
    }

    return inputElement;
  }
);

Input.displayName = 'Input';
