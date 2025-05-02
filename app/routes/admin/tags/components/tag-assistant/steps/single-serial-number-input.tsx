import { Input } from "~/components/ui/input";
import Step from "../components/step";
import { coerceNumeric } from "../utils/inputs";

export default function StepSingleSerialNumberInput({
  onStepBackward,
  onContinue,
  serialNumber,
  setSerialNumber,
}: {
  onStepBackward: () => void;
  onContinue: () => void;
  serialNumber: string | undefined;
  setSerialNumber: (serialNumber: string) => void;
}) {
  return (
    <Step
      title="What's the serial number of the tag you want to program?"
      onStepBackward={onStepBackward}
      onContinue={onContinue}
      continueDisabled={!serialNumber}
      className="max-w-xs"
    >
      <div>
        <Input
          inputMode="numeric"
          value={serialNumber}
          onChange={(e) => setSerialNumber(coerceNumeric(e.target.value))}
          placeholder="0000099"
        />
        <p className="text-xs text-muted-foreground italic mt-1">
          The serial number is printed on the front of each tag.
        </p>
      </div>
    </Step>
  );
}

StepSingleSerialNumberInput.StepId = "single-serial-number-input";
