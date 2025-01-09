import { type PropsWithChildren } from "react";
import { redirect } from "react-router";
import { getValidatedFormData } from "remix-hook-form";
import type { z } from "zod";
import { api } from "~/.server/api";
import AssetDetailsForm from "~/components/assets/asset-details-form";
import AssetInspections from "~/components/assets/asset-inspections";
import AssetOrderRequests from "~/components/assets/asset-order-requests";
import { SendNotificationsForm } from "~/components/send-notifications-form";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { updateAssetSchema, updateAssetSchemaResolver } from "~/lib/schema";
import { cn } from "~/lib/utils";
import type { Route } from "./+types/details";

export const handle = {
  breadcrumb: ({ data }: Route.MetaArgs) => ({ label: data.name || "Details" }),
};

export const action = async ({ request, params }: Route.ActionArgs) => {
  const { id } = params;
  if (!id) {
    throw new Response("No Asset ID", { status: 400 });
  }

  if (request.method === "POST" || request.method === "PATCH") {
    const { data, errors } = await getValidatedFormData<
      z.infer<typeof updateAssetSchema>
    >(request, updateAssetSchemaResolver);

    if (errors) {
      throw Response.json({ errors }, { status: 400 });
    }

    return api.assets.update(request, id, data);
  } else if (request.method === "DELETE") {
    await api.assets.delete(request, id);
    return redirect("/assets");
  }

  throw new Response("Invalid method", { status: 405 });
};

export const loader = async ({ params, request }: Route.LoaderArgs) => {
  const { id } = params;
  if (!id) {
    throw new Response("No Asset ID", { status: 400 });
  }

  return api.assets.get(request, id);
};

export default function AssetDetails({
  loaderData: asset,
}: Route.ComponentProps) {
  return (
    <div className="grid grid-cols-6 gap-2 sm:gap-4">
      {/* <AuxiliaryCard title="Compliance">
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
      </AuxiliaryCard> */}
      <AuxiliaryCard title="Supply Requests">
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
      <Card className="col-span-3">
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
      <Card className="col-span-3">
        <CardHeader>
          <CardTitle>Consumables</CardTitle>
        </CardHeader>
        <CardContent>
          {/* <AssetInspections historyLogs={historyLogs} /> */}
        </CardContent>
      </Card>
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>Inspections</CardTitle>
        </CardHeader>
        <CardContent>
          <AssetInspections inspections={asset.inspections ?? []} />
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
    <Card className="col-span-full md:col-span-2">
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
