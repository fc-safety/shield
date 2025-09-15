import { Download, Nfc } from "lucide-react";
import { useMemo } from "react";
import OptionButton from "../../../../../../components/assistant/components/option-button";
import Step from "../../../../../../components/assistant/components/step";

export default function StepBulkProgramPart1({
  onExport,
  onProgramNow,
  onStepBackward,
  serialNumberMethod,
  serialNumberRangeStart,
  serialNumberRangeEnd,
  serialNumbers,
}: {
  onExport: () => void;
  onProgramNow: () => void;
  onStepBackward: () => void;
  serialNumberMethod: "sequential" | "manual";
  serialNumberRangeStart: string | undefined;
  serialNumberRangeEnd: string | undefined;
  serialNumbers: string[] | undefined;
}) {
  const serialNumberCount = useMemo(() => {
    if (serialNumberMethod === "sequential") {
      return serialNumberRangeEnd
        ? parseInt(serialNumberRangeEnd) - parseInt(serialNumberRangeStart ?? "0") + 1
        : 0;
    }
    return serialNumbers?.length ?? 0;
  }, [serialNumberMethod, serialNumberRangeStart, serialNumberRangeEnd, serialNumbers]);

  const subtitle = useMemo(
    () => (
      <>
        You have provided serial numbers for{" "}
        <span className="font-bold">
          {serialNumberCount.toLocaleString()} tag
          {serialNumberCount === 1 ? "" : "s"}
        </span>
        . 🎉
      </>
    ),
    [serialNumberCount]
  );

  return (
    <Step
      className="max-w-sm"
      title="Great! Let's talk about programming the tags."
      subtitle={subtitle}
      onStepBackward={onStepBackward}
    >
      <OptionButton onClick={onExport}>
        <Download /> Export tag data
      </OptionButton>
      <OptionButton onClick={onProgramNow}>
        <Nfc />
        Program tags now
      </OptionButton>
    </Step>
  );
}

StepBulkProgramPart1.StepId = "bulk-program-part-1";
