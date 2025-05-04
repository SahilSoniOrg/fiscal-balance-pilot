import { useState, useCallback } from 'react';

interface UseDialogStateOptions {
  /**
   * Initial open state for the dialog
   */
  initialOpen?: boolean;

  /**
   * Callback to run before dialog closes
   * Return false to prevent dialog from closing
   */
  onBeforeClose?: () => boolean | Promise<boolean>;

  /**
   * Callback to run after dialog opens
   */
  onOpen?: () => void;

  /**
   * Callback to run after dialog closes
   */
  onClose?: () => void;
}

/**
 * A custom hook for managing dialog open/close state with consistent patterns
 * 
 * @param options Configuration options for the dialog
 * @returns Dialog state management utilities
 * 
 * @example
 * const { 
 *   isOpen, 
 *   open, 
 *   close, 
 *   toggle 
 * } = useDialogState({
 *   onBeforeClose: () => {
 *     // Confirm if there are unsaved changes
 *     if (formState.isDirty) {
 *       return confirm('You have unsaved changes. Are you sure you want to close?');
 *     }
 *     return true;
 *   }
 * });
 */
function useDialogState(options: UseDialogStateOptions = {}) {
  const {
    initialOpen = false,
    onBeforeClose,
    onOpen,
    onClose
  } = options;

  const [isOpen, setIsOpen] = useState(initialOpen);

  const open = useCallback(() => {
    setIsOpen(true);
    onOpen?.();
  }, [onOpen]);

  const close = useCallback(async () => {
    if (onBeforeClose) {
      const canClose = await onBeforeClose();
      if (!canClose) {
        return;
      }
    }

    setIsOpen(false);
    onClose?.();
  }, [onBeforeClose, onClose]);

  const toggle = useCallback(() => {
    if (isOpen) {
      close();
    } else {
      open();
    }
  }, [isOpen, open, close]);
  
  // Handler compatible with shadcn/ui Dialog's onOpenChange
  const handleOpenChange = useCallback(async (open: boolean) => {
    if (open) {
      setIsOpen(true);
      onOpen?.();
    } else {
      if (onBeforeClose) {
        const canClose = await onBeforeClose();
        if (!canClose) {
          return;
        }
      }
      setIsOpen(false);
      onClose?.();
    }
  }, [onBeforeClose, onOpen, onClose]);

  return {
    isOpen,
    open,
    close,
    toggle,
    handleOpenChange
  };
}

export default useDialogState; 