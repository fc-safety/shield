import { useMutation } from "@tanstack/react-query";
import { Copy, ExternalLink, Loader2, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Button } from "~/components/ui/button";
import { useAuthenticatedFetch } from "~/hooks/use-authenticated-fetch";
import Step from "../../../../../../components/assistant/components/step";
import SubStep from "../../../../../../components/assistant/components/sub-step";
import { generateSignedTagUrl } from "../../../services/tags.service";
import DisplayTagWriteData from "../components/display-tag-write-data";

export default function StepSingleProgram({
  serialNumber,
  onRestart,
  onStepBackward,
  onRegisterTag,
  registerToAssetMode,
}: {
  serialNumber: string;
  onRestart: () => void;
  onStepBackward: () => void;
  onRegisterTag: (tagUrl: string) => void;
  registerToAssetMode: boolean;
}) {
  const { fetchOrThrow } = useAuthenticatedFetch();
  const { mutate: getGeneratedTagUrl, isPending: isGeneratingTagUrl } = useMutation({
    mutationFn: (options: { serialNumber: string; externalId?: string }) =>
      generateSignedTagUrl(fetchOrThrow, options.serialNumber, options.externalId),
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

  const title = registerToAssetMode
    ? "Great! Next, we need to program the tag."
    : "Almost done! Time to program the tag.";

  return (
    <Step
      title={title}
      subtitle="Use your NFC device to program this unique URL to the tag."
      onStepBackward={onStepBackward}
      footerSlotEnd={
        registerToAssetMode ? undefined : (
          <Button onClick={onRestart} variant="secondary">
            <RotateCcw /> Write another tag
          </Button>
        )
      }
      onContinue={() => onRegisterTag(writeData ?? "")}
      continueButtonText={registerToAssetMode ? "Register tag" : "(Optional) Register tag"}
    >
      <SubStep idx={0} title="Copy the following URL to your clipboard.">
        <div className="bg-background text-foreground border-accent flex h-16 flex-col items-center justify-center gap-2 rounded-md border px-4 py-2">
          {isGeneratingTagUrl || writeData === null ? (
            <div className="flex flex-col items-center justify-center gap-1">
              <Loader2 className="size-4 animate-spin" />
              <p className="text-xs">Preparing your tag data for programming...</p>
            </div>
          ) : (
            <DisplayTagWriteData data={writeData} />
          )}
        </div>
        <p className="text-muted-foreground text-xs leading-5 italic">
          To copy the above URL to your clipboard, click the{" "}
          <span className="border-border inline rounded-md border px-1 py-0.5">
            <Copy className="inline size-3" />
          </span>{" "}
          button.
        </p>
      </SubStep>

      <SubStep idx={1} title="Write the URL to the tag from your NFC device.">
        <p className="text-muted-foreground text-xs italic">
          This final step requires a physical device and accompanying software to write NFC tags.
          Desktop computers require an external device while mobile phones have NFC built in.{" "}
          <Link
            to="/docs/writing-nfc-tags"
            target="_blank"
            rel="noreferrer"
            className="text-primary"
          >
            Learn more about the setup required to write to NFC tags.{" "}
            <ExternalLink className="inline size-3" />
          </Link>
        </p>
      </SubStep>
    </Step>
  );
}

StepSingleProgram.StepId = "single-program";
