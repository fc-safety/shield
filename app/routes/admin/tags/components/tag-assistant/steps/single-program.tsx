import { useMutation } from "@tanstack/react-query";
import {
  ArrowLeft,
  Copy,
  ExternalLink,
  Loader2,
  RotateCcw,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Button } from "~/components/ui/button";
import { useAuthenticatedFetch } from "~/hooks/use-authenticated-fetch";
import { generateSignedTagUrl } from "../../../services/tags.service";
import DisplayTagWriteData from "../components/display-tag-write-data";
import SubStep from "../components/sub-step";

export default function StepSingleProgram({
  serialNumber,
  onRestart,
  onStepBackward,
}: {
  serialNumber: string;
  onRestart: () => void;
  onStepBackward: () => void;
}) {
  const { fetchOrThrow } = useAuthenticatedFetch();
  const { mutate: getGeneratedTagUrl, isPending: isGeneratingTagUrl } =
    useMutation({
      mutationFn: (options: { serialNumber: string; externalId?: string }) =>
        generateSignedTagUrl(
          fetchOrThrow,
          options.serialNumber,
          options.externalId
        ),
    });

  const [writeData, setWriteData] = useState<string | null>(null);
  useEffect(() => {
    getGeneratedTagUrl(
      {
        serialNumber,
      },
      {
        onSuccess: (data) => {
          setWriteData(data.tagUrl);
        },
      }
    );
  }, [serialNumber]);

  return (
    <div className="w-full max-w-xl flex flex-col items-stretch justify-center gap-4">
      <div>
        <h3 className="text-center text-lg font-bold">
          Almost done! Time to program the tag.
        </h3>
        <h4 className="text-center text-base text-muted-foreground">
          Follow the steps to finish programming.
        </h4>
      </div>

      <SubStep idx={0} title="Copy the following URL to your clipboard.">
        <div className="h-16 flex flex-col gap-2 items-center justify-center rounded-md bg-background text-foreground px-4 py-2 ring ring-accent">
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
        <p className="text-xs leading-5 text-muted-foreground italic">
          To copy the above URL to your clipboard, click the{" "}
          <span className="inline px-1 py-0.5 rounded-md border border-border">
            <Copy className="size-3 inline" />
          </span>{" "}
          button.
        </p>
      </SubStep>

      <SubStep idx={1} title="Write the URL to the tag from your NFC device.">
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

      <div className="flex flex-row-reverse gap-4 justify-between">
        <Button onClick={onRestart}>
          <RotateCcw /> Write another tag
        </Button>
        <Button onClick={onStepBackward} variant="secondary">
          <ArrowLeft /> Back
        </Button>
      </div>
    </div>
  );
}

StepSingleProgram.StepId = "single-program";
