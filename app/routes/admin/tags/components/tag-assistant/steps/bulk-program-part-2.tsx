import { useMutation } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  ExternalLink,
  Loader2,
  RotateCcw,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import { Button } from "~/components/ui/button";
import { useAuthenticatedFetch } from "~/hooks/use-authenticated-fetch";
import { generateSignedTagUrl } from "../../../services/tags.service";
import DisplayTagWriteData from "../components/display-tag-write-data";
import Step from "../components/step";
import SubStep from "../components/sub-step";
import { incrementSerialNumber } from "../utils/inputs";

export default function StepBulkProgramPart2({
  onRestart,
  onStepBackward,
  serialNumberMethod,
  serialNumberRangeStart,
  serialNumberRangeEnd,
  serialNumbers,
}: {
  onRestart: () => void;
  onStepBackward: () => void;
  serialNumberMethod: "sequential" | "manual";
  serialNumberRangeStart: string | undefined;
  serialNumberRangeEnd: string | undefined;
  serialNumbers: string[] | undefined;
}) {
  const tagDataCache = useRef<Map<string, string>>(new Map()).current;

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

  const getSerialNumber = useCallback(
    (idx: number) => {
      if (serialNumberMethod === "sequential") {
        return serialNumberRangeStart
          ? incrementSerialNumber(serialNumberRangeStart, idx)
          : null;
      } else {
        return serialNumbers?.at(idx) ?? null;
      }
    },
    [
      serialNumberMethod,
      serialNumberRangeStart,
      serialNumberRangeEnd,
      serialNumbers,
    ]
  );

  const [currentSerialNumberIdx, setCurrentSerialNumberIdx] = useState(0);
  const currentSerialNumber = useMemo(() => {
    return getSerialNumber(currentSerialNumberIdx);
  }, [currentSerialNumberIdx, getSerialNumber]);

  const { fetchOrThrow } = useAuthenticatedFetch();
  const { mutate: getGeneratedTagUrl, isPending: isGeneratingTagUrl } =
    useMutation({
      mutationFn: async (serialNumber: string) => {
        if (tagDataCache.has(serialNumber)) {
          return tagDataCache.get(serialNumber) as string;
        }

        const data = await generateSignedTagUrl(fetchOrThrow, serialNumber);
        tagDataCache.set(serialNumber, data.tagUrl);
        return data.tagUrl;
      },
    });

  const [writeData, setWriteData] = useState<string | null>(null);
  useEffect(() => {
    if (currentSerialNumber === null) {
      return;
    }

    getGeneratedTagUrl(currentSerialNumber, {
      onSuccess: (data) => {
        setWriteData(data);
      },
    });
  }, [currentSerialNumber, getGeneratedTagUrl]);

  return (
    <Step
      title="Good choice! Let's get started."
      subtitle="Follow the steps for each serial number."
      onStepBackward={onStepBackward}
      footerSlotEnd={
        <Button onClick={onRestart} variant="outline">
          <RotateCcw /> Start new batch
        </Button>
      }
    >
      <SubStep idx={0} title="Copy the following URL to your clipboard.">
        <div className="rounded-md bg-background text-foreground ring ring-accent">
          <div className="text-xs w-full flex items-center justify-between gap-2 px-4 py-1 bg-card text-card-foreground rounded-t-md border-b border-accent">
            <div>
              {(currentSerialNumberIdx + 1).toLocaleString()} /{" "}
              {serialNumberCount.toLocaleString()}
            </div>
            <div className="flex flex-row gap-1">
              <Button
                variant="secondary"
                size="icon"
                disabled={currentSerialNumberIdx === 0 || isGeneratingTagUrl}
                onClick={() => {
                  if (currentSerialNumberIdx > 0) {
                    setCurrentSerialNumberIdx(currentSerialNumberIdx - 1);
                  }
                }}
              >
                <ChevronLeft />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                disabled={
                  currentSerialNumberIdx === serialNumberCount - 1 ||
                  isGeneratingTagUrl
                }
                onClick={() => {
                  if (currentSerialNumberIdx < serialNumberCount - 1) {
                    setCurrentSerialNumberIdx(currentSerialNumberIdx + 1);
                  }
                }}
              >
                <ChevronRight />
              </Button>
            </div>
          </div>
          <div className="h-16 flex flex-col gap-2 items-center justify-center px-4 py-2">
            {isGeneratingTagUrl || writeData === null ? (
              <div className="flex flex-col gap-1 items-center justify-center">
                <Loader2 className="size-4 animate-spin" />
                <p className="text-xs">
                  Preparing your tag data for programming...
                </p>
              </div>
            ) : (
              <DisplayTagWriteData data={writeData} />
            )}
          </div>
        </div>
        <p className="text-xs leading-5 text-muted-foreground italic">
          Use the{" "}
          <span className="inline px-1 py-0.5 rounded-md border border-border">
            <ChevronRight className="size-3 inline" />
          </span>{" "}
          button to move the next serial number. To copy the above URL to your
          clipboard, click the{" "}
          <span className="inline px-1 py-0.5 rounded-md border border-border">
            <Copy className="size-3 inline" />
          </span>{" "}
          button.
        </p>
      </SubStep>

      <SubStep
        idx={1}
        title={
          <>
            Using your NFC device, write the URL to the tag{" "}
            <span className="font-bold">with the following serial number:</span>
          </>
        }
      >
        <div className="border-border border rounded-md p-4 flex items-center justify-center">
          <p className="font-bold text-lg">{currentSerialNumber}</p>
        </div>
        <p className="text-xs text-muted-foreground italic">
          This final step requires a physical device and accompanying software
          to write NFC tags. Desktop computers require an external device while
          mobile phones have NFC built in.{" "}
          <Link
            to="/docs/writing-nfc-tags"
            target="_blank"
            rel="noreferrer"
            className="text-primary"
          >
            Learn more about the setup required to write to NFC tags.{" "}
            <ExternalLink className="size-3 inline" />
          </Link>
        </p>
      </SubStep>
    </Step>
  );
}

StepBulkProgramPart2.StepId = "bulk-program-part-2";
