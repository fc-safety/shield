import type { ColumnDef } from "@tanstack/react-table";
import { format, formatDistanceToNow } from "date-fns";
import { ShieldAlert, ShieldCheck, ShieldClose } from "lucide-react";
import { useMemo, type PropsWithChildren } from "react";
import { data, type UIMatch } from "react-router";
import type { z } from "zod";
import { api } from "~/.server/api";
import { GOOGLE_MAPS_API_KEY } from "~/.server/config";
import ActiveIndicator from "~/components/active-indicator";
import AssetDetailsForm from "~/components/assets/asset-details-form";
import AssetInspectionAlerts from "~/components/assets/asset-inspection-alerts";
import AssetInspections from "~/components/assets/asset-inspections";
import AssetOrderRequests from "~/components/assets/asset-order-requests";
import DataList from "~/components/data-list";
import { DataTable } from "~/components/data-table/data-table";
import { DataTableColumnHeader } from "~/components/data-table/data-table-column-header";
import { SendNotificationsForm } from "~/components/send-notifications-form";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import type { Consumable } from "~/lib/models";
import { updateAssetSchema, updateAssetSchemaResolver } from "~/lib/schema";
import {
  buildTitleFromBreadcrumb,
  countBy,
  getValidatedFormDataOrThrow,
  validateParam,
} from "~/lib/utils";
import type { Route } from "./+types/details";

export const handle = {
  breadcrumb: ({
    data,
  }: Route.MetaArgs | UIMatch<Route.MetaArgs["data"] | undefined>) => ({
    label: data?.asset.name || "Details",
  }),
};

export const meta: Route.MetaFunction = ({ matches }) => {
  return [{ title: buildTitleFromBreadcrumb(matches) }];
};

export const action = async ({ request, params }: Route.ActionArgs) => {
  const id = validateParam(params, "id");

  if (request.method === "POST" || request.method === "PATCH") {
    const { data } = await getValidatedFormDataOrThrow<
      z.infer<typeof updateAssetSchema>
    >(request, updateAssetSchemaResolver);

    return api.assets.update(request, id, data);
  } else if (request.method === "DELETE") {
    return api.assets.deleteAndRedirect(request, id, "/assets");
  }

  throw new Response("Invalid method", { status: 405 });
};

export const loader = async ({ params, request }: Route.LoaderArgs) => {
  const id = validateParam(params, "id");
  const { data: asset, init } = await api.assets.get(request, id);
  return data(
    {
      asset,
      googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    },
    init ?? undefined
  );
};

export default function AssetDetails({
  loaderData: { asset, googleMapsApiKey },
}: Route.ComponentProps) {
  const groupedAlerts = useMemo(() => {
    return countBy(asset.alerts ?? [], "alertLevel");
  }, [asset]);

  return (
    <div className="grid gap-2 sm:gap-4">
      <div className="grid grid-cols-[repeat(auto-fit,_minmax(250px,_1fr))] gap-2 sm:gap-4">
        <AuxiliaryCard title="Alerts">
          <div className="flex flex-col items-center gap-4 h-full">
            <div className="flex items-center gap-2 flex-wrap">
              {groupedAlerts.some((g) => g.alertLevel === "URGENT") ? (
                <ShieldClose className="text-red-500 size-16" />
              ) : groupedAlerts.some((count) => count.alertLevel === "INFO") ? (
                <ShieldAlert className="text-yellow-500 size-16" />
              ) : (
                <ShieldCheck className="text-primary size-16" />
              )}
              <p className="text-muted-foreground text-center text-xs grid gap-1">
                {groupedAlerts
                  .sort((g1) => (g1.alertLevel === "URGENT" ? -1 : 1))
                  .map((g) => (
                    <span key={g.alertLevel}>
                      {g.count}{" "}
                      <span className="lowercase font-bold">
                        {g.alertLevel}
                      </span>{" "}
                      alert
                      {g.count == 1 ? "" : "s"}
                    </span>
                  ))}
              </p>
            </div>
            {groupedAlerts.length === 0 ? (
              <p className="text-muted-foreground text-center text-xs">
                No alerts.
              </p>
            ) : (
              <AssetInspectionAlerts asset={asset} />
            )}
          </div>
        </AuxiliaryCard>
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
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,_minmax(450px,_1fr))] gap-2 sm:gap-4">
        <Card className="h-max">
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
        <div className="h-max grid gap-2 sm:gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Setup Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <DataList
                details={
                  asset.setupQuestionResponses?.map((r) => ({
                    label: r.assetQuestion?.prompt ?? (
                      <span className="italic">
                        Prompt for this question has been removed or is not
                        available.
                      </span>
                    ),
                    value: r.value,
                  })) ?? []
                }
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Consumables</CardTitle>
            </CardHeader>
            <CardContent>
              <ConsumablesTable consumables={asset.consumables ?? []} />
            </CardContent>
          </Card>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Inspections</CardTitle>
        </CardHeader>
        <CardContent>
          <AssetInspections
            inspections={asset.inspections ?? []}
            googleMapsApiKey={googleMapsApiKey}
          />
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
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function ConsumablesTable({ consumables }: { consumables: Consumable[] }) {
  const columns = useMemo<ColumnDef<Consumable>[]>(
    () => [
      {
        accessorKey: "product.name",
        header: ({ column }) => <DataTableColumnHeader column={column} />,
      },
      {
        accessorKey: "expiresOn",
        header: ({ column }) => <DataTableColumnHeader column={column} />,
        cell: ({ getValue }) => {
          const value = getValue() as string;
          return (
            <span title={format(value, "PPpp")}>
              {formatDistanceToNow(value, {
                addSuffix: true,
                includeSeconds: true,
              })}
            </span>
          );
        },
      },
      {
        accessorKey: "quantity",
        header: ({ column }) => <DataTableColumnHeader column={column} />,
      },
    ],
    []
  );

  return (
    <>
      <DataTable
        columns={columns}
        data={consumables}
        searchPlaceholder="Search consumables..."
      />
    </>
  );
}
