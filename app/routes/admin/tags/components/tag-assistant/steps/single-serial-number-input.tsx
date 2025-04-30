import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
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
    <div className="w-full max-w-xs flex flex-col items-stretch justify-center gap-4">
      <h3 className="text-center text-lg font-bold">
        What's the serial number of the tag you want to program?
      </h3>
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
      <div className="flex flex-row-reverse gap-4 justify-between">
        <Button onClick={onContinue} disabled={!serialNumber}>
          Continue
          <ArrowRight />
        </Button>
        <Button onClick={onStepBackward} variant="secondary">
          <ArrowLeft /> Back
        </Button>
      </div>
    </div>
  );
}

StepSingleSerialNumberInput.StepId = "single-serial-number-input";
