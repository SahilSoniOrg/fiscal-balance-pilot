import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

export type InputType = 'text' | 'email' | 'password' | 'number' | 'date' | 'textarea';

export interface FormFieldProps {
  /** Unique identifier for the field */
  id: string;
  /** Field name (used for form state) */
  name: string;
  /** Field label */
  label?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Field type */
  type?: InputType;
  /** Whether the field is required */
  required?: boolean;
  /** Current value */
  value: string | number;
  /** Error message */
  error?: string;
  /** Whether the field is disabled */
  disabled?: boolean;
  /** onChange handler */
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  /** Custom CSS classes for the input */
  className?: string;
  /** Number of rows for textarea */
  rows?: number;
  /** Min value for number inputs */
  min?: number;
  /** Max value for number inputs */
  max?: number;
  /** Step value for number inputs */
  step?: number | string;
  /** Description or help text */
  description?: string;
}

/**
 * A standardized form field component with validation support
 * 
 * @example
 * // Basic usage with useFormState hook
 * const { values, errors, handleChange } = useFormState<{ name: string }>({ name: '' });
 * 
 * // In your JSX
 * <FormField
 *   id="name"
 *   name="name"
 *   label="Account Name"
 *   value={values.name}
 *   error={errors.name}
 *   onChange={handleChange}
 *   required
 * />
 */
const FormField: React.FC<FormFieldProps> = ({
  id,
  name,
  label,
  placeholder,
  type = 'text',
  required = false,
  value,
  error,
  disabled = false,
  onChange,
  className = '',
  rows = 3,
  min,
  max,
  step,
  description
}) => {
  // Render appropriate input based on type
  const renderInput = () => {
    const inputClassName = cn(
      'w-full', 
      error ? 'border-red-500 focus:ring-red-500' : '',
      className
    );

    if (type === 'textarea') {
      return (
        <Textarea
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          rows={rows}
          className={inputClassName}
          required={required}
        />
      );
    }
    
    return (
      <Input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={inputClassName}
        required={required}
        min={min}
        max={max}
        step={step}
      />
    );
  };

  return (
    <div className="space-y-2">
      {label && (
        <div className="flex items-center justify-between">
          <Label 
            htmlFor={id}
            className={cn(required ? 'after:content-["*"] after:text-red-500 after:ml-1' : '')}
          >
            {label}
          </Label>
          {error && <span className="text-xs text-red-500">{error}</span>}
        </div>
      )}
      
      {renderInput()}
      
      {description && !error && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  );
};

export default FormField; 