import { ArrowLeft, Braces, Download, RotateCcw } from "lucide-react";
import { Button } from "~/components/ui/button";
import { useAuthenticatedFetch } from "~/hooks/use-authenticated-fetch";
import {
  exportTagDataAsCsv,
  exportTagDataAsJson,
} from "../../../services/tags.service";

export default function StepBulkProgramExport({
  onRestart,
  onStepBackward,
  serialNumbers,
  serialNumberRangeStart,
  serialNumberRangeEnd,
  serialNumberMethod,
}: {
  onRestart: () => void;
  onStepBackward: () => void;
  serialNumbers?: string[];
  serialNumberRangeStart?: string;
  serialNumberRangeEnd?: string;
  serialNumberMethod: "sequential" | "manual";
}) {
  const { fetchOrThrow } = useAuthenticatedFetch();

  const handleDownloadCsv = () => {
    exportTagDataAsCsv(fetchOrThrow, {
      serialNumbers,
      serialNumberRangeStart,
      serialNumberRangeEnd,
      method: serialNumberMethod,
    });
  };

  const handleDownloadJson = () => {
    exportTagDataAsJson(fetchOrThrow, {
      serialNumbers,
      serialNumberRangeStart,
      serialNumberRangeEnd,
      method: serialNumberMethod,
    });
  };

  return (
    <div className="w-full max-w-xl flex flex-col items-stretch justify-center gap-4">
      <div>
        <h3 className="text-center text-lg font-bold">
          Export now, program whenever or wherever.
        </h3>
        <h4 className="text-center text-base text-muted-foreground">
          Choose a format to begin downloading the tag data.
        </h4>
      </div>

      <Button className="self-center" onClick={handleDownloadCsv}>
        <Download /> Export as CSV
      </Button>
      <Button className="self-center" onClick={handleDownloadJson}>
        <Braces /> Export as JSON
      </Button>

      <div className="flex flex-row-reverse gap-4 justify-between">
        <Button onClick={onRestart}>
          <RotateCcw /> Start new batch
        </Button>
        <Button onClick={onStepBackward} variant="secondary">
          <ArrowLeft /> Back
        </Button>
      </div>
    </div>
  );
}

StepBulkProgramExport.StepId = "bulk-program-export";
