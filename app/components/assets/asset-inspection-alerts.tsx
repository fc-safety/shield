import { format } from "date-fns";
import { useCallback, useEffect, useState } from "react";
import { useFetcher } from "react-router";
import type { Alert, Asset, ResultsPage } from "~/lib/models";
import { ResponsiveDialog } from "../responsive-dialog";
import { Button } from "../ui/button";

export default function AssetInspectionAlerts({ asset }: { asset: Asset }) {
  const [alerts, setAlerts] = useState<Alert[] | undefined>();
  const fetcher = useFetcher<ResultsPage<Alert>>();

  const handlePreloadAlerts = useCallback(() => {
    if (fetcher.state === "idle" && !fetcher.data) {
      fetcher.load(`/api/assets/${asset.id}/alerts`);
    }
  }, [fetcher, asset.id]);

  useEffect(() => {
    if (fetcher.data) {
      setAlerts(fetcher.data.results);
    }
  }, [fetcher.data]);

  return (
    <ResponsiveDialog
      title="Inspection Alerts"
      trigger={
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onMouseEnter={handlePreloadAlerts}
        >
          View Alerts
        </Button>
      }
    >
      <div>
        {alerts?.map((alert) => (
          <div key={alert.id}>
            <h3 className="text-sm font-semibold mb-2">{alert.alertLevel}</h3>
            <p className="text-sm">{format(alert.createdOn, "PPpp")}</p>
            <p className="text-sm">{alert.message}</p>
          </div>
        ))}
      </div>
    </ResponsiveDialog>
  );
}
