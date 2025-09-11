import { Braces, Download, RotateCcw } from "lucide-react";
import { Button } from "~/components/ui/button";
import { useAuthenticatedFetch } from "~/hooks/use-authenticated-fetch";
import Step from "../../../../../../components/assistant/components/step";
import { exportTagDataAsCsv, exportTagDataAsJson } from "../../../services/tags.service";

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
    <Step
      title="Export now, program whenever or wherever."
      subtitle="Choose a format to begin downloading the tag data."
      onStepBackward={onStepBackward}
      footerSlotEnd={
        <Button onClick={onRestart} variant="outline">
          <RotateCcw /> Start new batch
        </Button>
      }
    >
      <Button className="self-center" onClick={handleDownloadCsv}>
        <Download /> Export as CSV
      </Button>
      <Button className="self-center" onClick={handleDownloadJson}>
        <Braces /> Export as JSON
      </Button>
    </Step>
  );
}

StepBulkProgramExport.StepId = "bulk-program-export";
