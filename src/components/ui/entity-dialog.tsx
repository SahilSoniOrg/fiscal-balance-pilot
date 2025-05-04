import React, { ReactNode } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Save } from "lucide-react";
import ErrorDisplay from '@/components/ui/error-display';
import useDialogState from '@/hooks/useDialogState';
import { FormErrors } from '@/hooks/useFormState';

export interface EntityDialogProps<T> {
  /** Dialog title */
  title: string;
  /** Optional description displayed below the title */
  description?: string;
  /** Whether the dialog is in edit mode */
  isEditMode?: boolean;
  /** Whether the form is currently submitting */
  isSubmitting?: boolean;
  /** Form-level errors */
  formError?: string;
  /** Whether the form has unsaved changes */
  isDirty?: boolean;
  /** Function to handle form submission */
  onSubmit: (e: React.FormEvent) => void;
  /** Function called when the dialog is closed */
  onClose: () => void;
  /** Function called after the dialog is fully closed */
  onClosed?: () => void;
  /** Whether to skip the unsaved changes confirmation */
  skipUnsavedCheck?: boolean;
  /** Custom CSS classes for the dialog content */
  className?: string;
  /** Max width class for the dialog (following shadcn/ui patterns) */
  maxWidth?: 'sm:max-w-sm' | 'sm:max-w-md' | 'sm:max-w-lg' | 'sm:max-w-xl' | 'sm:max-w-2xl' | 'sm:max-w-3xl' | 'sm:max-w-4xl';
  /** The form content */
  children: ReactNode;
  /** Text for the submit button */
  submitText?: string;
  /** Text shown when submitting */
  submittingText?: string;
  /** Text for the cancel button */
  cancelText?: string;
  /** Whether the dialog is open */
  isOpen: boolean;
}

/**
 * A standardized dialog component for entity create and edit operations
 * 
 * @example
 * // Basic usage with useFormState hook
 * const { 
 *   values, 
 *   errors, 
 *   isSubmitting, 
 *   isDirty,
 *   handleChange, 
 *   handleSubmit 
 * } = useFormState<AccountRequest>(initialValues, validationRules, saveAccount);
 * 
 * // In your JSX
 * <EntityDialog
 *   title={isEdit ? "Edit Account" : "Create Account"}
 *   description="Enter the account details"
 *   isEditMode={!!initialData}
 *   isSubmitting={isSubmitting}
 *   formError={errors.form}
 *   isDirty={isDirty}
 *   onSubmit={handleSubmit}
 *   onClose={() => setIsDialogOpen(false)}
 *   isOpen={isDialogOpen}
 * >
 *   <FormField
 *     id="name"
 *     name="name"
 *     label="Account Name"
 *     value={values.name}
 *     error={errors.name}
 *     onChange={handleChange}
 *     required
 *   />
 * </EntityDialog>
 */
function EntityDialog<T>({
  title,
  description,
  isEditMode = false,
  isSubmitting = false,
  formError,
  isDirty = false,
  onSubmit,
  onClose,
  onClosed,
  skipUnsavedCheck = false,
  className = '',
  maxWidth = 'sm:max-w-md',
  children,
  submitText,
  submittingText,
  cancelText = "Cancel",
  isOpen = false
}: EntityDialogProps<T>) {
  // Determine the correct button text based on mode and state
  const defaultSubmitText = isEditMode ? 'Update' : 'Create';
  const defaultSubmittingText = isEditMode ? 'Updating...' : 'Creating...';
  
  // Use the provided text or fallback to defaults
  const finalSubmitText = submitText || defaultSubmitText;
  const finalSubmittingText = submittingText || defaultSubmittingText;

  // Use our dialog state hook to manage open/close with confirmation
  const dialogState = useDialogState({
    initialOpen: isOpen,
    onBeforeClose: async () => {
      // If there are unsaved changes and we're not skipping the check, confirm before closing
      if (isDirty && !skipUnsavedCheck && !isSubmitting) {
        return window.confirm("You have unsaved changes. Are you sure you want to close?");
      }
      return true;
    },
    onClose: onClosed
  });

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={async (open) => {
        if (!open) {
          // Dialog is being closed
          try {
            await dialogState.close();
            onClose();
          } catch {
            // If close is prevented, do nothing
          }
        }
      }}
    >
      <DialogContent className={`${maxWidth} ${className}`}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && (
            <DialogDescription>{description}</DialogDescription>
          )}
        </DialogHeader>

        {formError && (
          <ErrorDisplay 
            message={formError} 
            severity="error"
          />
        )}
        
        <form onSubmit={onSubmit} className="space-y-4 py-4">
          {children}
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                dialogState.close();
                onClose();
              }}
              disabled={isSubmitting}
            >
              {cancelText}
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                  {finalSubmittingText}
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {finalSubmitText}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default EntityDialog; 