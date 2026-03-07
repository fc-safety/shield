import { PanelRightClose } from "lucide-react";
import { Button } from "~/components/ui/button";
import { useAssetQuestionDetailFormContext } from "../asset-question-detail-form.context";

export function EmptySidepanel() {
  const { closeSidepanel } = useAssetQuestionDetailFormContext();

  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-muted-foreground w-full text-center text-sm">No data selected.</p>
      <Button variant="secondary" type="button" onClick={() => closeSidepanel()}>
        <PanelRightClose /> Close sidepanel
      </Button>
    </div>
  );
}
