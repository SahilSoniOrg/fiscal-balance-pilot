import { ApiResponse } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

/**
 * Configuration options for form submission
 */
export interface FormSubmissionOptions<T, R> {
  /** The API function to call with form data */
  apiFunction: (data: T) => Promise<ApiResponse<R>>;
  /** Callback to run when submission is successful */
  onSuccess?: (data: R) => void;
  /** Callback to run when submission fails */
  onError?: (error: string) => void;
  /** Success message to display */
  successMessage?: string;
  /** Error message prefix to display (followed by the actual error) */
  errorMessagePrefix?: string;
  /** Whether to show a toast on success */
  showSuccessToast?: boolean;
  /** Whether to show a toast on error */
  showErrorToast?: boolean;
}

/**
 * Creates a standardized form submission handler
 * 
 * @param options Configuration options for the submission handler
 * @returns A function that handles form submission
 * 
 * @example
 * // In a component
 * const { toast } = useToast();
 * 
 * const handleSubmit = createFormSubmissionHandler({
 *   apiFunction: (data) => accountService.createAccount(workplaceId, data),
 *   onSuccess: (account) => {
 *     onSaved(account);
 *     onClose();
 *   },
 *   successMessage: 'Account created successfully',
 *   errorMessagePrefix: 'Failed to create account',
 * });
 * 
 * // Use with useFormState
 * const formState = useFormState(initialValues, validationRules, handleSubmit);
 */
export function createFormSubmissionHandler<T, R>(
  options: FormSubmissionOptions<T, R>
): (data: T) => Promise<void> {
  const {
    apiFunction,
    onSuccess,
    onError,
    successMessage = 'Operation completed successfully',
    errorMessagePrefix = 'Error',
    showSuccessToast = true,
    showErrorToast = true,
  } = options;

  return async (data: T): Promise<void> => {
    try {
      const response = await apiFunction(data);

      if (response.error) {
        if (showErrorToast) {
          // This needs to be called in a component context
          const { toast } = useToast();
          toast({
            title: errorMessagePrefix,
            description: response.error,
            variant: 'destructive',
          });
        }

        if (onError) {
          onError(response.error);
        }
        
        throw new Error(response.error);
      }

      if (response.data) {
        if (showSuccessToast) {
          // This needs to be called in a component context
          const { toast } = useToast();
          toast({
            title: 'Success',
            description: successMessage,
          });
        }

        if (onSuccess) {
          onSuccess(response.data);
        }
      }
    } catch (error: any) {
      const errorMessage = error.message || 'An unexpected error occurred';
      
      if (showErrorToast) {
        // This needs to be called in a component context
        const { toast } = useToast();
        toast({
          title: errorMessagePrefix,
          description: errorMessage,
          variant: 'destructive',
        });
      }

      if (onError) {
        onError(errorMessage);
      }
      
      throw error;
    }
  };
}

/**
 * A hook that creates a form submission handler with toast capabilities
 */
export function useFormSubmission() {
  const { toast } = useToast();

  /**
   * Handles form submission with standardized error and success handling
   * 
   * @param options Configuration options for the submission
   * @returns A function that handles form submission
   * 
   * @example
   * const { handleSubmit } = useFormSubmission();
   * 
   * const submitAccount = handleSubmit({
   *   apiFunction: (data) => accountService.createAccount(workplaceId, data),
   *   onSuccess: (account) => {
   *     onSaved(account);
   *     onClose();
   *   },
   *   successMessage: 'Account created successfully',
   *   errorMessagePrefix: 'Failed to create account',
   * });
   * 
   * // Use with useFormState
   * const formState = useFormState(initialValues, validationRules, submitAccount);
   */
  function handleSubmit<T, R>(options: Omit<FormSubmissionOptions<T, R>, 'toast'>) {
    return async (data: T): Promise<void> => {
      const {
        apiFunction,
        onSuccess,
        onError,
        successMessage = 'Operation completed successfully',
        errorMessagePrefix = 'Error',
        showSuccessToast = true,
        showErrorToast = true,
      } = options;

      try {
        const response = await apiFunction(data);

        if (response.error) {
          if (showErrorToast) {
            toast({
              title: errorMessagePrefix,
              description: response.error,
              variant: 'destructive',
            });
          }

          if (onError) {
            onError(response.error);
          }
          
          throw new Error(response.error);
        }

        if (response.data) {
          if (showSuccessToast) {
            toast({
              title: 'Success',
              description: successMessage,
            });
          }

          if (onSuccess) {
            onSuccess(response.data);
          }
        }
      } catch (error: any) {
        const errorMessage = error.message || 'An unexpected error occurred';
        
        if (showErrorToast) {
          toast({
            title: errorMessagePrefix,
            description: errorMessage,
            variant: 'destructive',
          });
        }

        if (onError) {
          onError(errorMessage);
        }
        
        throw error;
      }
    };
  }

  return { handleSubmit };
} 