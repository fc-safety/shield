import { Input } from "~/components/ui/input";
import Step from "../components/step";
import { coerceNumeric } from "../utils/inputs";

export default function StepSingleSerialNumberInput({
  onStepBackward,
  onContinue,
  serialNumber,
  setSerialNumber,
  registerToAssetMode,
}: {
  onStepBackward: () => void;
  onContinue: () => void;
  serialNumber: string | undefined;
  setSerialNumber: (serialNumber: string) => void;
  registerToAssetMode: boolean;
}) {
  const title = registerToAssetMode
    ? "First, what's the serial number on the asset's tag?"
    : "What's the serial number of the tag you want to program?";

  return (
    <Step
      title={title}
      onStepBackward={registerToAssetMode ? undefined : onStepBackward}
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
          onKeyUp={(e) => {
            if (e.key === "Enter" && serialNumber) {
              onContinue();
            }
          }}
        />
        <p className="text-muted-foreground mt-1 text-xs italic">
          The serial number is printed on the front of each tag.
        </p>
      </div>
    </Step>
  );
}

StepSingleSerialNumberInput.StepId = "single-serial-number-input";
