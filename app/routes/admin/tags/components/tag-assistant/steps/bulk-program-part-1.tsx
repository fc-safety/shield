import { ArrowLeft, Download, Nfc } from "lucide-react";
import { useMemo } from "react";
import { Button } from "~/components/ui/button";

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
        ? parseInt(serialNumberRangeEnd) -
            parseInt(serialNumberRangeStart ?? "0") +
            1
        : 0;
    }
    return serialNumbers?.length ?? 0;
  }, [
    serialNumberMethod,
    serialNumberRangeStart,
    serialNumberRangeEnd,
    serialNumbers,
  ]);

  return (
    <div className="w-full max-w-xl flex flex-col items-stretch justify-center gap-4">
      <div>
        <h3 className="text-center text-lg font-bold">
          Great! Let's talk about programming the tags.
        </h3>
        <h4 className="text-center text-base text-muted-foreground">
          You have provided serial numbers for{" "}
          <span className="font-bold">
            {serialNumberCount.toLocaleString()} tag
            {serialNumberCount === 1 ? "" : "s"}
          </span>
          . 🎉
        </h4>
      </div>
      <Button onClick={onExport} className="self-center">
        <Download /> Export tag data
      </Button>
      <Button onClick={onProgramNow} className="self-center">
        <Nfc />
        Program tags now
      </Button>
      <div className="flex flex-row-reverse gap-4 justify-end">
        <Button onClick={onStepBackward} variant="secondary">
          <ArrowLeft /> Back
        </Button>
      </div>
    </div>
  );
}

StepBulkProgramPart1.StepId = "bulk-program-part-1";
