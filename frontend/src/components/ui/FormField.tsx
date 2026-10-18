import React from 'react';
import { AlertCircle } from 'lucide-react';

export interface FormFieldProps {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  optional?: boolean;
  rightLabelElement?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Shared FormField component (Barema F2 requirement):
 * Renders label + input/select + validation error message below the field.
 */
export const FormField: React.FC<FormFieldProps> = ({
  label,
  htmlFor,
  error,
  hint,
  optional = false,
  rightLabelElement,
  children,
}) => {
  return (
    <div className="form-field">
      <div className="form-label-row">
        <label className="form-label" htmlFor={htmlFor}>
          {label}
        </label>
        {rightLabelElement ? (
          rightLabelElement
        ) : optional ? (
          <span className="form-label-optional">Opcional</span>
        ) : null}
      </div>
      {children}
      {error ? (
        <span className="form-error" role="alert">
          <AlertCircle size={12} />
          <span>{error}</span>
        </span>
      ) : hint ? (
        <span className="form-hint">{hint}</span>
      ) : null}
    </div>
  );
};
