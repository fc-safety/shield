import { useImmer } from "use-immer";
import type { ConfirmationDialogProps } from "~/components/confirmation-dialog";

export interface ConfirmAction extends ConfirmationDialogProps {
  onConfirm: () => void;
  onCancel: () => void;
  onOpenChange: (open: boolean) => void;
}

export default function useConfirmAction({
  variant = "default",
}: {
  variant?: "default" | "destructive";
} = {}) {
  const [confirmAction, setConfirmAction] = useImmer<ConfirmAction>({
    open: false,
    onConfirm: () => {},
    onCancel: () => {},
    onOpenChange: () => {},
    title: "Are you sure?",
    message: "",
    requiredUserInput: "",
    destructive: variant === "destructive",
    confirmText: variant === "destructive" ? "Delete" : "Confirm",
  });

  return [
    {
      ...confirmAction,
      onOpenChange: (open: boolean) => {
        setConfirmAction((draft) => {
          draft.open = open;
        });
      },
    } satisfies ConfirmAction,
    setConfirmAction,
  ] as const;
}
