import { useCallback, useState } from "react";

export interface UseDialogStateProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultOpen?: boolean;
}

export interface UseDialogStateReturn {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  setOpen: (open: boolean) => void;
  openDialog: () => void;
  closeDialog: () => void;
  toggleDialog: () => void;
}

/**
 * Hook to manage dialog open state with support for controlled and uncontrolled modes.
 * If `open` and `onOpenChange` props are provided, the hook operates in controlled mode.
 * Otherwise, it manages internal state (uncontrolled mode).
 *
 * @param props - Configuration object
 * @param props.open - Controlled open state from parent component
 * @param props.onOpenChange - Controlled open change handler from parent component
 * @param props.defaultOpen - Default open state for uncontrolled mode (defaults to false)
 * @returns Object containing open state and control functions
 *
 * @example
 * // Uncontrolled mode
 * const { open, onOpenChange, openDialog, closeDialog } = useDialogState();
 *
 * @example
 * // Controlled mode
 * const [isOpen, setIsOpen] = useState(false);
 * const { open, onOpenChange } = useDialogState({
 *   open: isOpen,
 *   onOpenChange: setIsOpen,
 * });
 */
export function useDialogState({
  open: openProp,
  onOpenChange: onOpenChangeProp,
  defaultOpen = false,
}: UseDialogStateProps = {}): UseDialogStateReturn {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isControlled = openProp !== undefined;
  const open = openProp ?? internalOpen;
  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (isControlled) {
        onOpenChangeProp?.(newOpen);
      } else {
        setInternalOpen(newOpen);
      }
    },
    [isControlled, onOpenChangeProp]
  );
  const setOpen = useCallback(
    (newOpen: boolean) => {
      handleOpenChange(newOpen);
    },
    [handleOpenChange]
  );
  const openDialog = useCallback(() => {
    handleOpenChange(true);
  }, [handleOpenChange]);
  const closeDialog = useCallback(() => {
    handleOpenChange(false);
  }, [handleOpenChange]);
  const toggleDialog = useCallback(() => {
    handleOpenChange(!open);
  }, [handleOpenChange, open]);
  return {
    open,
    onOpenChange: handleOpenChange,
    setOpen,
    openDialog,
    closeDialog,
    toggleDialog,
  };
}
