import { Button } from "@/components/ui/button";
import { Pencil, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import {
  ResponsiveModal,
  ResponsiveModalContent,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalTrigger,
} from "../../responsive-modal";
import type { AssetQuestionDetailFormProps } from "./asset-question-detail-form.component";
import AssetQuestionDetailForm from "./asset-question-detail-form.component";

interface NewAssetQuestionButtonProps extends AssetQuestionDetailFormProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function EditAssetQuestionButton({
  trigger,
  open: openProp,
  onOpenChange,
  ...passthroughProps
}: NewAssetQuestionButtonProps) {
  const [internalOpen, setInternalOpen] = useState(false);

  const open = openProp ?? internalOpen;
  const setOpen = (open: boolean) => {
    setInternalOpen(open);
    onOpenChange?.(open);
  };
  useEffect(() => {
    onOpenChange?.(internalOpen);
  }, [internalOpen, onOpenChange]);

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={setOpen}
      isNested
    >
      <ResponsiveModalTrigger>
        {trigger !== undefined ? (
          trigger
        ) : (
          <Button type="button" size="sm">
            {passthroughProps.assetQuestion ? <Pencil /> : <Plus />}
            {passthroughProps.assetQuestion ? "Edit" : "Add"} Question
          </Button>
        )}
      </ResponsiveModalTrigger>
      <ResponsiveModalContent classNames={{ dialog: "sm:max-w-5xl p-0" }}>
        <ResponsiveModalHeader className="px-4 pt-4">
          <ResponsiveModalTitle>
            {passthroughProps.assetQuestion ? "Edit Question" : "Add New Question"}
          </ResponsiveModalTitle>
        </ResponsiveModalHeader>
        <AssetQuestionDetailForm
          onSubmitted={() => {
            setOpen(false);
            passthroughProps.onSubmitted?.();
          }}
          {...passthroughProps}
        />
      </ResponsiveModalContent>
    </ResponsiveModal>
  );
}
