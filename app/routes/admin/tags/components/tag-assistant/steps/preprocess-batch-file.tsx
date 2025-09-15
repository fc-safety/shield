import { CheckCircle2 } from "lucide-react";
import { Suspense, use } from "react";
import GradientScrollArea from "~/components/gradient-scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Skeleton } from "~/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import Step from "../../../../../../components/assistant/components/step";
import { extractCsvHeaders } from "../utils/inputs";

export default function StepPreprocessBatchFile({
  onStepBackward,
  batchFile,
}: {
  onStepBackward: () => void;
  batchFile?: File;
}) {
  if (!batchFile) {
    return <NoFileError onStepBackward={onStepBackward} />;
  }

  return (
    <Step
      title="Thanks! Now we'll make sure your data is ready for processing."
      subtitle="We'll check for the right columns and make sure we have the right data."
      onStepBackward={onStepBackward}
    >
      <div>
        <Suspense fallback={<Skeleton className="h-[200px] w-full" />}>
          <ColumnMappingTable rawCsvHeadersPromise={extractCsvHeaders(batchFile)} />
        </Suspense>
      </div>
    </Step>
  );
}

const NoFileError = ({ onStepBackward }: { onStepBackward: () => void }) => {
  return (
    <Step
      title="Uh oh! Looks like we didn't get that file."
      subtitle="Try going back and uploading a file again."
      onStepBackward={onStepBackward}
      className="max-w-sm"
    ></Step>
  );
};

const ColumnMappingTable = ({
  rawCsvHeadersPromise,
}: {
  rawCsvHeadersPromise: Promise<string[]>;
}) => {
  const rawCsvHeaders = use(rawCsvHeadersPromise);

  return (
    <GradientScrollArea className="h-[20rem]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead></TableHead>
            <TableHead>Required property</TableHead>
            <TableHead>Your file's column</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requiredProperties.map((property) => (
            <TableRow key={property.propertyKey}>
              <TableCell>
                <CheckCircle2 className="text-primary size-4" />
              </TableCell>
              <TableCell>{property.label}</TableCell>
              <TableCell>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a column" />
                  </SelectTrigger>
                  <SelectContent>
                    {rawCsvHeaders.map((header) => (
                      <SelectItem key={header} value={header}>
                        {header}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </GradientScrollArea>
  );
};

StepPreprocessBatchFile.StepId = "preprocess-batch-file";

const requiredProperties: {
  label: string;
  propertyKey: string;
}[] = [
  {
    label: "Name",
    propertyKey: "asset.name",
  },

  {
    label: "Serial Number",
    propertyKey: "asset.serialNumber",
  },
  {
    label: "Product ID",
    propertyKey: "product.id",
  },
  {
    label: "Site ID",
    propertyKey: "site.id",
  },
  {
    label: "Location",
    propertyKey: "asset.location",
  },
  {
    label: "Placement",
    propertyKey: "asset.placement",
  },
  {
    label: "Tag Serial Number",
    propertyKey: "tag.serialNumber",
  },
];
