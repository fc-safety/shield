import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMemo, useState } from "react";
import { useDialogState } from "~/hooks/use-dialog-state";

export interface ConfirmationDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  message?: string | React.ReactNode;
  title?: string;
  onConfirm?: () => void;
  confirmText?: string;
  onCancel?: () => void;
  cancelText?: string;
  destructive?: boolean;
  requiredUserInput?: string;
  requiredUserInputPrompt?: string;
  requiredUserInputPlaceholder?: string;
}

export default function ConfirmationDialog({
  open: openProp,
  onOpenChange,
  trigger,
  message,
  title = "Are you sure?",
  onConfirm,
  confirmText = "Confirm",
  onCancel,
  cancelText = "Cancel",
  destructive,
  requiredUserInput,
  requiredUserInputPrompt,
  requiredUserInputPlaceholder,
}: ConfirmationDialogProps) {
  const [userInput, setUserInput] = useState("");
  const { open, setOpen } = useDialogState({
    open: openProp,
    onOpenChange,
  });

  const confirmEnabled = useMemo(() => {
    if (!requiredUserInput) {
      return true;
    }
    return userInput === requiredUserInput;
  }, [userInput, requiredUserInput]);

  return (
    <AlertDialog
      open={open}
      onOpenChange={(openState) => {
        onOpenChange?.(openState);
        if (!openState) {
          setUserInput("");
        }
      }}
    >
      {trigger && <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{message}</AlertDialogDescription>
        </AlertDialogHeader>
        {requiredUserInput && (
          <div className="grid gap-2">
            <Label className="font-bold" htmlFor="userInput">
              {requiredUserInputPrompt ?? `Please type "${requiredUserInput}" to confirm:`}
            </Label>
            <Input
              id="userInput"
              type="text"
              placeholder={requiredUserInputPlaceholder ?? requiredUserInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && confirmEnabled) {
                  onConfirm?.();
                  setOpen(false);
                }
              }}
            />
          </div>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>{cancelText}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={!confirmEnabled}
            destructive={destructive}
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
