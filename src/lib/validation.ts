import { ValidationRule } from '@/hooks/useFormState';

/**
 * Validation utility functions for form fields
 */
const validation = {
  /**
   * Validates that a field is not empty
   */
  required: <T extends Record<string, any>>(message = 'This field is required'): ValidationRule<T> => ({
    validate: (value) => {
      if (value === undefined || value === null) return false;
      if (typeof value === 'string') return value.trim().length > 0;
      if (typeof value === 'number') return true;
      if (Array.isArray(value)) return value.length > 0;
      return !!value;
    },
    message
  }),

  /**
   * Validates that a field is a valid email
   */
  email: <T extends Record<string, any>>(message = 'Please enter a valid email address'): ValidationRule<T> => ({
    validate: (value) => {
      if (!value) return true; // Only validate if there's a value (use required() for required fields)
      if (typeof value !== 'string') return false;
      
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      return emailRegex.test(value);
    },
    message
  }),

  /**
   * Validates that a field meets a minimum length requirement
   */
  minLength: <T extends Record<string, any>>(min: number, message?: string): ValidationRule<T> => ({
    validate: (value) => {
      if (!value) return true; // Only validate if there's a value
      if (typeof value !== 'string') return false;
      return value.length >= min;
    },
    message: message || `Must be at least ${min} characters`
  }),

  /**
   * Validates that a field doesn't exceed a maximum length
   */
  maxLength: <T extends Record<string, any>>(max: number, message?: string): ValidationRule<T> => ({
    validate: (value) => {
      if (!value) return true; // Only validate if there's a value
      if (typeof value !== 'string') return false;
      return value.length <= max;
    },
    message: message || `Cannot exceed ${max} characters`
  }),

  /**
   * Validates that a number field meets a minimum value requirement
   */
  min: <T extends Record<string, any>>(min: number, message?: string): ValidationRule<T> => ({
    validate: (value) => {
      if (value === undefined || value === null || value === '') return true;
      const numValue = Number(value);
      return !isNaN(numValue) && numValue >= min;
    },
    message: message || `Must be at least ${min}`
  }),

  /**
   * Validates that a number field doesn't exceed a maximum value
   */
  max: <T extends Record<string, any>>(max: number, message?: string): ValidationRule<T> => ({
    validate: (value) => {
      if (value === undefined || value === null || value === '') return true;
      const numValue = Number(value);
      return !isNaN(numValue) && numValue <= max;
    },
    message: message || `Cannot exceed ${max}`
  }),

  /**
   * Validates that a field matches a specific pattern
   */
  pattern: <T extends Record<string, any>>(regex: RegExp, message = 'Invalid format'): ValidationRule<T> => ({
    validate: (value) => {
      if (!value) return true; // Only validate if there's a value
      if (typeof value !== 'string') return false;
      return regex.test(value);
    },
    message
  }),

  /**
   * Validates that a field matches a specific field
   */
  matches: <T extends Record<string, any>>(field: keyof T, fieldName?: string): ValidationRule<T> => ({
    validate: (value, formValues) => {
      if (!value) return true; // Only validate if there's a value
      return value === formValues[field];
    },
    message: (_, formValues) => `Must match ${fieldName || String(field)} (${formValues[field]})`
  }),

  /**
   * Custom validation function
   */
  custom: <T extends Record<string, any>>(
    validateFn: (value: any, formValues: T) => boolean,
    message: string | ((value: any, formValues: T) => string)
  ): ValidationRule<T> => ({
    validate: validateFn,
    message
  })
};

export default validation; 