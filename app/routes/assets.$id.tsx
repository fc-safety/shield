import { ShieldAlert, ShieldCheck, ShieldClose } from "lucide-react";
import { type PropsWithChildren } from "react";
import { redirect, useLoaderData } from "react-router";
import { getValidatedFormData } from "remix-hook-form";
import AssetDetailsForm from "~/components/assets/asset-details-form";
import AssetHistoryLogs from "~/components/assets/asset-history-logs";
import AssetOrderRequests from "~/components/assets/asset-order-requests";
import { SendNotificationsForm } from "~/components/send-notifications-form";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { demoAssetHistoryLogs, demoAssets } from "~/lib/demo-data";
import { assetSchemaResolver } from "~/lib/schema";
import { cn } from "~/lib/utils";
import type { Route } from "../+types/root";

export const handle = {
  breadcrumb: () => ({ label: "Details" }),
};

export const action = async ({ request }: Route.ActionArgs) => {
  const { data, errors } = await getValidatedFormData(
    request,
    assetSchemaResolver
  );

  if (errors) {
    throw Response.json({ errors }, { status: 400 });
  }

  const asset = demoAssets.find((asset) => asset.id === data?.id);

  if (!asset) {
    throw new Response("Asset not found", { status: 404 });
  }

  Object.assign(asset, data ?? {});
  return redirect("/assets/" + asset.id);
};

export const loader = ({ params }: Route.LoaderArgs) => {
  const { id } = params;
  const asset = demoAssets.find((asset) => asset.id === id);

  if (!asset) {
    throw new Response("Asset not found", { status: 404 });
  }

  return {
    asset,
    historyLogs: demoAssetHistoryLogs,
  };
};

export default function AssetDetails() {
  const { asset, historyLogs } = useLoaderData<typeof loader>();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
      <AuxiliaryCard title="Compliance">
        <div className="flex flex-col items-center gap-2 h-full pt-2">
          {asset.status === "ok" ? (
            <ShieldCheck className="text-primary size-16" />
          ) : asset.status === "warning" ? (
            <ShieldAlert className="text-yellow-500 size-16" />
          ) : (
            <ShieldClose className="text-red-500 size-16" />
          )}
          <p className="text-muted-foreground text-center text-xs">
            {asset.status === "ok"
              ? "Fully Compliant"
              : asset.status === "warning"
              ? "Partially Compliant"
              : "Not Compliant"}
          </p>
        </div>
      </AuxiliaryCard>
      <AuxiliaryCard title="Order Requests">
        <AssetOrderRequests />
      </AuxiliaryCard>
      <AuxiliaryCard title="Notifications">
        <SendNotificationsForm />
      </AuxiliaryCard>
      <AuxiliaryCard title="Inspection Route">
        <div className="space-y-4">
          <p className="text-muted-foreground text-xs">
            No route has been configured yet for this asset.
          </p>
          <Button type="submit" variant="secondary">
            Create New Route
          </Button>
        </div>
      </AuxiliaryCard>
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Asset Details
            <ActiveIndicator active={asset.active} />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AssetDetailsForm asset={asset} />
        </CardContent>
      </Card>
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>History</CardTitle>
        </CardHeader>
        <CardContent>
          <AssetHistoryLogs historyLogs={historyLogs} />
        </CardContent>
      </Card>
    </div>
  );
}

function AuxiliaryCard({
  title,
  children,
}: PropsWithChildren<{ title: string }>) {
  return (
    <Card className="col-span-2 md:col-span-1 lg:col-span-2 xl:col-span-1">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function ActiveIndicator({ active }: { active: boolean }) {
  return (
    <div
      className="relative size-3"
      title={active ? "Asset is active" : "Asset is inactive"}
    >
      {active && (
        <div className="absolute inset-0 bg-primary animate-ping rounded-full"></div>
      )}
      <div
        className={cn(
          "absolute inset-0 rounded-full",
          active ? "bg-primary" : "bg-muted-foreground"
        )}
      ></div>
    </div>
  );
}
