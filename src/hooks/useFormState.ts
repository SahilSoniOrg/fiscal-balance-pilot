import { useState, useCallback, useEffect } from 'react';

export type ValidationRule<T extends Record<string, any>> = {
  validate: (value: any, formValues: T) => boolean;
  message: string | ((value: any, formValues: T) => string);
};

export type ValidationRules<T extends Record<string, any>> = {
  [K in keyof T]?: ValidationRule<T>[];
};

// Define FormErrors to specify each field can have a string or undefined error message
export type FormErrors<T> = {
  [K in keyof T]?: string | undefined;
} & {
  form?: string | undefined;
};

/**
 * A custom hook for form state management with validation
 * 
 * @template T The type of form data
 * @param initialValues Initial values for the form
 * @param validationRules Rules to validate the form fields
 * @param onSubmit Function to call when the form is submitted and valid
 * @returns Form state management helpers
 * 
 * @example
 * const { 
 *   values, 
 *   errors, 
 *   isSubmitting, 
 *   handleChange, 
 *   handleSelectChange, 
 *   handleCheckboxChange, 
 *   validateField,
 *   validateForm,
 *   handleSubmit,
 *   reset
 * } = useFormState<AccountRequest>(
 *   { name: '', accountType: AccountType.ASSET },
 *   {
 *     name: [{ validate: value => !!value, message: 'Name is required' }]
 *   },
 *   async (data) => await saveAccount(data)
 * );
 */
function useFormState<T extends Record<string, any>>(
  initialValues: T,
  validationRules: ValidationRules<T> = {},
  onSubmit?: (values: T) => Promise<void> | void
) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<FormErrors<T>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Reset form to initial values or new values
  const reset = useCallback((newValues?: T) => {
    setValues(newValues || initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
    setIsDirty(false);
  }, [initialValues]);

  // Validate a specific field
  const validateField = useCallback((name: keyof T, value: any): string | undefined => {
    const fieldRules = validationRules[name];
    if (!fieldRules) return undefined;

    for (const rule of fieldRules) {
      const isValid = rule.validate(value, values);
      if (!isValid) {
        const message = typeof rule.message === 'function' 
          ? rule.message(value, values) 
          : rule.message;
        return message;
      }
    }
    
    return undefined;
  }, [validationRules, values]);

  // Validate the entire form
  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors<T> = {};
    let isValid = true;

    // Validate each field with rules
    Object.keys(validationRules).forEach((key) => {
      const fieldName = key as keyof T;
      const error = validateField(fieldName, values[fieldName]);
      
      if (error) {
        // Type-safe assignment
        newErrors[fieldName] = error as FormErrors<T>[keyof T];
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [validateField, validationRules, values]);

  // Handle input change for text inputs, number inputs, etc.
  const handleChange = useCallback((
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const fieldName = name as keyof T;
    let parsedValue: any = value;

    // Convert values to the appropriate type
    if (type === 'number') {
      parsedValue = value === '' ? '' : Number(value);
    }

    setValues(prev => ({ ...prev, [fieldName]: parsedValue }));
    setTouched(prev => ({ ...prev, [fieldName]: true }));
    setIsDirty(true);

    // Validate field if it has been touched
    const error = validateField(fieldName, parsedValue);
    setErrors(prev => ({ ...prev, [fieldName]: error }));
  }, [validateField]);

  // Handle select change (for custom select components)
  const handleSelectChange = useCallback((name: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [name]: value }));
    setTouched(prev => ({ ...prev, [name]: true }));
    setIsDirty(true);

    // Validate field
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  }, [validateField]);

  // Handle checkbox change
  const handleCheckboxChange = useCallback((name: keyof T, checked: boolean) => {
    setValues(prev => ({ ...prev, [name]: checked }));
    setTouched(prev => ({ ...prev, [name]: true }));
    setIsDirty(true);

    // Validate field
    const error = validateField(name, checked);
    setErrors(prev => ({ ...prev, [name]: error }));
  }, [validateField]);

  // Handle form submission
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    // Validate all fields
    const isValid = validateForm();
    if (!isValid || !onSubmit) return;

    setIsSubmitting(true);
    try {
      await onSubmit(values);
    } catch (error: any) {
      // Set form-level error
      setErrors(prev => ({ 
        ...prev, 
        form: error.message || 'An error occurred during submission'
      }));
    } finally {
      setIsSubmitting(false);
    }
  }, [validateForm, onSubmit, values]);

  // Set a specific field value programmatically
  const setFieldValue = useCallback((name: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [name]: value }));
    
    // Validate field if it has been touched
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  }, [validateField, touched]);

  // Set multiple field values programmatically
  const setFieldValues = useCallback((newValues: Partial<T>) => {
    setValues(prev => ({ ...prev, ...newValues }));
    
    // Validate touched fields
    const newErrors = { ...errors };
    Object.keys(newValues).forEach((key) => {
      const fieldName = key as keyof T;
      if (touched[fieldName]) {
        const error = validateField(fieldName, newValues[fieldName]);
        // Type-safe assignment
        if (error !== undefined) {
          newErrors[fieldName] = error as FormErrors<T>[keyof T];
        }
      }
    });
    
    setErrors(newErrors);
  }, [errors, validateField, touched]);

  // Set form error manually (useful for API errors)
  const setFormError = useCallback((error: string) => {
    setErrors(prev => ({ ...prev, form: error }));
  }, []);

  // Clear a specific error
  const clearError = useCallback((name: keyof FormErrors<T>) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[name];
      return newErrors;
    });
  }, []);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isDirty,
    handleChange,
    handleSelectChange,
    handleCheckboxChange,
    setFieldValue,
    setFieldValues,
    setFormError,
    clearError,
    validateField,
    validateForm,
    handleSubmit,
    reset
  };
}

export default useFormState; 