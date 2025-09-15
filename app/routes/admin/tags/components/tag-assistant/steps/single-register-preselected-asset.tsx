import { Loader2, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import { useModalFetcher } from "~/hooks/use-modal-fetcher";
import { createTagSchema } from "~/lib/schema";
import SuccessCircle from "~/routes/inspect/components/success-circle";
import Step from "../../../../../../components/assistant/components/step";
import DisplayTagWriteData from "../components/display-tag-write-data";
import { parseTagUrl } from "../utils/parse";

const registerTagSchema = createTagSchema.extend({
  client: z.object({
    connect: z.object({
      id: z.string().nonempty(),
    }),
  }),
  site: z.object({
    connect: z.object({
      id: z.string().nonempty(),
    }),
  }),
  asset: z.object({
    connect: z.object({
      id: z.string().nonempty(),
    }),
  }),
});

type TForm = z.infer<typeof registerTagSchema>;

export default function StepSingleRegisterPreselectedAsset({
  tagUrl,
  onStepBackward,
  onClose,
  clientId,
  siteId,
  assetId,
  isRegistrationCompleted,
  onRegistrationCompleted,
  onRestart,
}: {
  tagUrl: string;
  onStepBackward: () => void;
  onClose?: () => void;
  clientId: string;
  siteId: string;
  assetId: string;
  isRegistrationCompleted: boolean;
  onRegistrationCompleted: () => void;
  onRestart?: () => void;
}) {
  const { createOrUpdateJson, isSubmitting } = useModalFetcher({
    onSubmitted: () => {
      onRegistrationCompleted();
    },
  });

  const registerTag = useCallback(
    (data: TForm) => {
      createOrUpdateJson(data, {
        path: "/api/proxy/tags",
        viewContext: "admin",
      });
    },
    [createOrUpdateJson]
  );

  const { serialNumber, externalId } = useMemo(() => parseTagUrl(tagUrl), [tagUrl]);

  const handleSubmit = useCallback(() => {
    registerTag({
      serialNumber,
      externalId,
      client: { connect: { id: clientId } },
      site: { connect: { id: siteId } },
      asset: { connect: { id: assetId } },
    });
  }, [registerTag]);

  const autoSubmitted = useRef(false);
  useEffect(() => {
    if (!isRegistrationCompleted && !isSubmitting && !autoSubmitted.current) {
      autoSubmitted.current = true;
      handleSubmit();
    }
  }, [isRegistrationCompleted, isSubmitting, handleSubmit]);

  return (
    <Step
      onStepBackward={onStepBackward}
      footerSlotEnd={
        <>
          {onRestart && (
            <Button onClick={onRestart} variant="outline">
              <RotateCcw /> Start over
            </Button>
          )}
          {onClose && (
            <Button onClick={onClose} variant="default" disabled={isSubmitting}>
              Close
            </Button>
          )}
        </>
      }
      stepBackwardDisabled={isSubmitting}
    >
      {isRegistrationCompleted ? (
        <div className="flex flex-col items-center gap-2 pt-4">
          <Title>Tag registered successfully!</Title>
          <SuccessCircle />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 pt-4">
          <Title>Registering tag to asset...</Title>
          <Loader2 className="text-muted-foreground size-16 animate-spin" />
        </div>
      )}
      <div className="mb-4 flex w-full flex-col items-center gap-1">
        <span className="text-muted-foreground text-center text-xs font-semibold">
          In case you missed it, here's that tag URL again:
        </span>
        <div className="bg-background text-foreground border-accent flex h-16 w-full items-center justify-center gap-2 rounded-md border px-4 py-2">
          <DisplayTagWriteData data={tagUrl} />
        </div>
      </div>
    </Step>
  );
}

StepSingleRegisterPreselectedAsset.StepId = "single-register-preselected-asset";

const Title = ({ children }: { children: React.ReactNode }) => {
  return <h4 className="text-center text-base font-semibold">{children}</h4>;
};
