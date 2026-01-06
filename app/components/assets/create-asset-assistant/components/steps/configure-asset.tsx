import { Loader2 } from "lucide-react";
import { useRef, useState } from "react";
import ConfigureAssetForm, {
  type ConfigureAssetFormRef,
} from "~/components/assets/configure-asset-form";
import Step from "~/components/assistant/components/step";
import { Button } from "~/components/ui/button";
import type { AssetQuestion } from "~/lib/models";

export default function StepConfigureAsset({
  assetId,
  questions,
  onStepBackward,
  onContinue,
  continueLabel,
  onClose,
}: {
  assetId: string;
  questions: AssetQuestion[];
  onStepBackward: () => void;
  onContinue?: () => void;
  continueLabel?: string;
  onClose?: () => void;
}) {
  const [isValid, setIsValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<ConfigureAssetFormRef>(null);

  const handleConfigureAsset = () => {
    formRef.current?.handleSubmit();
  };

  return (
    <Step
      title="Configure Asset"
      subtitle="Some assets require additional configuration to be ready for inspection."
      onStepBackward={onStepBackward}
      onContinue={onContinue ? () => handleConfigureAsset() : undefined}
      footerSlotEnd={
        onContinue ? null : (
          <Button
            type="button"
            disabled={!isValid || isSubmitting}
            onClick={() => handleConfigureAsset()}
          >
            {isSubmitting && <Loader2 className="animate-spin" />}
            Save{onClose ? " & Close" : ""}
          </Button>
        )
      }
      continueDisabled={!isValid}
      continueLoading={isSubmitting}
      continueButtonText={continueLabel ? `Save & ${continueLabel}` : "Save & Continue"}
    >
      <ConfigureAssetForm
        assetId={assetId}
        questions={questions}
        onSubmitted={onContinue ?? onClose}
        setIsValid={setIsValid}
        setIsSubmitting={setIsSubmitting}
        ref={formRef}
      />
    </Step>
  );
}

StepConfigureAsset.StepId = "configure-asset";
