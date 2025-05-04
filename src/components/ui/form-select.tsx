import React from 'react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface FormSelectProps {
  /** Unique identifier for the field */
  id: string;
  /** Field name (used for form state) */
  name: string;
  /** Field label */
  label?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Current value */
  value: string;
  /** Options for the select */
  options: SelectOption[];
  /** Error message */
  error?: string;
  /** Whether the field is disabled */
  disabled?: boolean;
  /** Whether the field is required */
  required?: boolean;
  /** onChange handler */
  onChange: (value: string) => void;
  /** Custom CSS classes for the select */
  className?: string;
  /** Description or help text */
  description?: string;
  /** Loading state */
  isLoading?: boolean;
  /** Empty state when no options are available */
  emptyMessage?: string;
}

/**
 * A standardized select component with error handling
 * 
 * @example
 * // Basic usage with useFormState hook
 * const { values, errors, handleSelectChange } = useFormState<{ accountType: string }>({ accountType: '' });
 * 
 * // In your JSX
 * <FormSelect
 *   id="accountType"
 *   name="accountType"
 *   label="Account Type"
 *   value={values.accountType}
 *   error={errors.accountType}
 *   options={[
 *     { value: 'ASSET', label: 'Asset' },
 *     { value: 'LIABILITY', label: 'Liability' },
 *   ]}
 *   onChange={(value) => handleSelectChange('accountType', value)}
 *   required
 * />
 */
const FormSelect: React.FC<FormSelectProps> = ({
  id,
  name,
  label,
  placeholder = 'Select an option',
  value,
  options,
  error,
  disabled = false,
  required = false,
  onChange,
  className = '',
  description,
  isLoading = false,
  emptyMessage = 'No options available'
}) => {
  const hasOptions = options.length > 0;

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
      
      <Select
        value={value}
        onValueChange={onChange}
        disabled={disabled || isLoading || !hasOptions}
      >
        <SelectTrigger 
          id={id}
          className={cn(
            error ? 'border-red-500 focus:ring-red-500' : '', 
            className
          )}
        >
          <SelectValue placeholder={
            isLoading 
              ? 'Loading options...' 
              : !hasOptions 
                ? emptyMessage 
                : placeholder
          } />
        </SelectTrigger>
        <SelectContent>
          {hasOptions ? (
            options.map((option) => (
              <SelectItem 
                key={option.value} 
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </SelectItem>
            ))
          ) : (
            <div className="p-2 text-center text-sm text-muted-foreground">
              {emptyMessage}
            </div>
          )}
        </SelectContent>
      </Select>
      
      {description && !error && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  );
};

export default FormSelect; 