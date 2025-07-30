import { Button } from "@/components/ui/button";
import { Pencil, Plus } from "lucide-react";
import { useState } from "react";
import { ResponsiveDialog } from "../responsive-dialog";
import AssetQuestionDetailForm, {
  type AssetQuestionDetailFormProps,
} from "./asset-question-detail-form";

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
  const setOpen = onOpenChange ?? setInternalOpen;

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={setOpen}
      title={passthroughProps.assetQuestion ? "Edit Question" : "Add New Question"}
      dialogClassName="sm:max-w-3xl"
      trigger={
        trigger !== undefined ? (
          trigger
        ) : (
          <Button type="button" size="sm">
            {passthroughProps.assetQuestion ? <Pencil /> : <Plus />}
            {passthroughProps.assetQuestion ? "Edit" : "Add"} Question
          </Button>
        )
      }
    >
      <AssetQuestionDetailForm
        onSubmitted={() => {
          setOpen(false);
          passthroughProps.onSubmitted?.();
        }}
        {...passthroughProps}
      />
    </ResponsiveDialog>
  );
}
