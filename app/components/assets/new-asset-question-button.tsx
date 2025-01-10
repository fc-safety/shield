import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { useState } from "react";
import AssetQuestionDetailForm, {
  type AssetQuestionDetailFormProps,
} from "./asset-question-detail-form";

interface NewAssetQuestionButtonProps
  extends Omit<AssetQuestionDetailFormProps, "onSubmitted" | "assetQuestion"> {}

export default function NewAssetQuestionButton({
  ...formProps
}: NewAssetQuestionButtonProps) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" size="sm">
          <Plus />
          Add Question
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Question</DialogTitle>
        </DialogHeader>
        <AssetQuestionDetailForm
          onSubmitted={() => setOpen(false)}
          {...formProps}
        />
      </DialogContent>
    </Dialog>
  );
}
