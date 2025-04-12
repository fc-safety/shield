import { Loader2 } from "lucide-react";
import { useCallback, useState } from "react";
import type { DataOrError } from "~/.server/api-utils";
import { useAuth } from "~/contexts/auth-context";
import { useModalFetcher } from "~/hooks/use-modal-fetcher";
import type { Inspection } from "~/lib/models";
import { ResponsiveDialog } from "../responsive-dialog";
import { Button } from "../ui/button";
import InspectionDetails from "./inspection-details";

interface AssetInspectionDialogProps {
  inspectionId: string;
  trigger?: (
    isLoading: boolean,
    preloadInspection: (inspectionId: string) => void,
    setOpen: (open: boolean) => void
  ) => React.ReactNode;
}

export default function AssetInspectionDialog({
  inspectionId,
  trigger,
}: AssetInspectionDialogProps) {
  const { googleMapsApiKey } = useAuth();
  const { load, isLoading, data } = useModalFetcher<DataOrError<Inspection>>();

  const [open, setOpen] = useState(false);

  const preloadInspection = useCallback(
    (inspectionId: string) => {
      if (!inspectionId || inspectionId === data?.data?.id) return;
      load({
        path: `/api/proxy/inspections/${inspectionId}`,
      });
    },
    [load, data?.data?.id]
  );

  return (
    <ResponsiveDialog
      title="Inspection Details"
      dialogClassName="sm:max-w-lg"
      minWidth="578px"
      open={open}
      onOpenChange={setOpen}
      trigger={
        trigger?.(isLoading, preloadInspection, setOpen) ?? (
          <Button
            variant="secondary"
            size="sm"
            type="button"
            onMouseEnter={() => preloadInspection(inspectionId)}
            onTouchStart={() => preloadInspection(inspectionId)}
            onClick={() => setOpen(true)}
          >
            Details
          </Button>
        )
      }
    >
      {isLoading || !data?.data ? (
        <div className="flex h-full w-full items-center justify-center">
          <Loader2 className="animate-spin" />
        </div>
      ) : (
        <InspectionDetails
          inspection={data.data}
          googleMapsApiKey={googleMapsApiKey}
        />
      )}
    </ResponsiveDialog>
  );
}
