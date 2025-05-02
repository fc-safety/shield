import { Upload } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import Step from "../components/step";

export default function StepUploadBatchFile({
  onContinue,
  onStepBackward,
  selectedFile,
  onSelectFile,
}: {
  onContinue: () => void;
  onStepBackward: () => void;
  selectedFile: File | undefined;
  onSelectFile: (file: File) => void;
}) {
  return (
    <Step
      title="Great. Now let's take a look at that file."
      subtitle="Just upload a CSV file and we'll take it from there."
      onStepBackward={onStepBackward}
      onContinue={onContinue}
      continueDisabled={!selectedFile}
      className="max-w-sm"
    >
      <Label
        htmlFor="batch-file"
        className="flex items-center gap-3 w-full rounded-md border border-input bg-transparent p-1.5 pr-3 text-sm shadow-xs transition-colors "
      >
        <Input
          id="batch-file"
          className="hidden"
          type="file"
          accept=".csv"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              onSelectFile(file);
            }
          }}
        />
        <Button variant="secondary" size="sm" className="pointer-events-none">
          <Upload /> Upload
        </Button>
        <span className="text-ellipsis overflow-hidden">
          {selectedFile ? selectedFile.name : "No file selected."}
        </span>
      </Label>
    </Step>
  );
}

StepUploadBatchFile.StepId = "upload-batch-file";
