import type { ColumnDef } from "@tanstack/react-table";
import {
  differenceInDays,
  format,
  formatDistanceToNow,
  isAfter,
} from "date-fns";
import {
  Check,
  CircleAlert,
  CircleCheck,
  CircleX,
  ClipboardCheck,
  Clock,
  Pencil,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  X,
} from "lucide-react";
import { useMemo, type PropsWithChildren } from "react";
import { data, type UIMatch } from "react-router";
import type { z } from "zod";
import { api } from "~/.server/api";
import { GOOGLE_MAPS_API_KEY } from "~/.server/config";
import ActiveIndicator from "~/components/active-indicator";
import AssetInspectionAlert from "~/components/assets/asset-inspection-alert";
import AssetInspections from "~/components/assets/asset-inspections";
import AssetOrderRequests from "~/components/assets/asset-order-requests";
import EditAssetButton from "~/components/assets/edit-asset-button";
import { TagCard } from "~/components/assets/tag-selector";
import DataList from "~/components/data-list";
import { DataTable } from "~/components/data-table/data-table";
import { DataTableColumnHeader } from "~/components/data-table/data-table-column-header";
import ProductCard from "~/components/products/product-card";
import { SendNotificationsForm } from "~/components/send-notifications-form";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import type { Alert, Asset, Consumable } from "~/lib/models";
import { updateAssetSchema, updateAssetSchemaResolver } from "~/lib/schema";
import {
  buildTitleFromBreadcrumb,
  cn,
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
  return (
    <div className="grid gap-y-4 gap-x-2 sm:gap-x-4">
      <div className="grid grid-cols-[repeat(auto-fit,_minmax(250px,_1fr))] gap-y-4 gap-x-2 sm:gap-x-4">
        <StatusCard asset={asset} />
        <BasicCard title="Inspection Route">
          <div className="space-y-4">
            <p className="text-muted-foreground text-xs">
              No route has been configured yet for this asset.
            </p>
            <Button type="submit" variant="secondary">
              Create New Route
            </Button>
          </div>
        </BasicCard>
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,_minmax(450px,_1fr))] gap-y-4 gap-x-2 sm:gap-x-4">
        <Card className="h-max">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="inline-flex items-center gap-4">
                Asset Details
                <div className="flex gap-2">
                  <EditAssetButton
                    asset={asset}
                    trigger={
                      <Button variant="secondary" size="icon" type="button">
                        <Pencil />
                      </Button>
                    }
                  />
                </div>
              </div>
              <ActiveIndicator active={asset.active} />
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-8">
            <div className="grid gap-4">
              <Label>Properties</Label>
              <DataList
                details={[
                  {
                    label: "Name",
                    value: asset.name,
                  },
                  {
                    label: "Serial No.",
                    value: asset.serialNumber,
                  },
                  {
                    label: "Location",
                    value: asset.location,
                  },
                  {
                    label: "Placement",
                    value: asset.placement,
                  },
                  {
                    label: "Setup Completed",
                    value: asset.setupOn && format(asset.setupOn, "PPpp"),
                  },
                ]}
              />
            </div>
            <div className="grid gap-4">
              <Label>Setup Questions</Label>
              {asset.setupOn ? (
                asset.setupQuestionResponses?.length ? (
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
                ) : (
                  <span className="text-sm text-muted-foreground">
                    The setup process is complete for this asset, but there are
                    no setup questions to display.
                  </span>
                )
              ) : (
                <span className="text-sm text-muted-foreground">
                  The setup process has not been completed yet for this asset.
                </span>
              )}
            </div>
            <div className="grid gap-4">
              <Label>Product</Label>
              <ProductCard product={asset.product} />
            </div>
            <div className="grid gap-4">
              <Label>Tag</Label>
              {asset.tag ? (
                <TagCard tag={asset.tag} />
              ) : (
                <span className="text-sm text-muted-foreground">
                  No tag has been assigned to this asset.
                </span>
              )}
            </div>
            {/* <AssetDetailsForm asset={asset} /> */}
          </CardContent>
        </Card>
        <Tabs defaultValue="consumables">
          <TabsList className="grid w-full grid-cols-[1fr_1fr]">
            <TabsTrigger value="consumables">Consumables</TabsTrigger>
            <TabsTrigger value="alerts">
              Alerts
              {!!asset.alerts?.filter((a) => !a.resolved).length && (
                <span className="ml-2 bg-urgent text-xs text-urgent-foreground rounded-full flex items-center justify-center size-5">
                  {asset.alerts?.filter((a) => !a.resolved).length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="consumables">
            <BasicCard title="Requests" className="rounded-b-none">
              <AssetOrderRequests />
            </BasicCard>
            <BasicCard title="Consumables" className="rounded-t-none">
              <ConsumablesTable consumables={asset.consumables ?? []} />
            </BasicCard>
          </TabsContent>
          <TabsContent value="alerts">
            <BasicCard title="Notifications" className="rounded-b-none">
              <SendNotificationsForm />
            </BasicCard>
            <BasicCard title="History" className="rounded-t-none">
              <AlertsTable alerts={asset.alerts ?? []} />
            </BasicCard>
          </TabsContent>
        </Tabs>
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

function BasicCard({
  title,
  className,
  children,
}: PropsWithChildren<{ title: string; className?: string }>) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function StatusBadge({
  icon: IconComponent,
  status,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  status: string;
  className?: string;
}) {
  return (
    <Badge
      className={cn(
        "bg-primary text-primary-foreground hover:bg-primary py-1",
        className
      )}
    >
      <IconComponent className="mr-1 size-4" />
      {status}
    </Badge>
  );
}

function StatusCard({ asset }: { asset: Asset }) {
  const inspectionStatus = useMemo(() => {
    const mostRecentInspection = asset.inspections
      ?.sort((a, b) => (isAfter(a.createdOn, b.createdOn) ? -1 : 1))
      .at(0);
    if (!mostRecentInspection) return "never";
    const daysSinceInspection = differenceInDays(
      Date.now(),
      mostRecentInspection.createdOn
    );
    if (daysSinceInspection < 30) return "current";
    if (daysSinceInspection < 90) return "overdue";
    return "expired";
  }, [asset.inspections]);

  const groupedActiveAlerts = useMemo(() => {
    return countBy(
      asset.alerts?.filter((a) => !a.resolved) ?? [],
      "alertLevel"
    );
  }, [asset]);

  return (
    <BasicCard title="Status">
      <div className="grid gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ClipboardCheck className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium">Inspection Status</span>
          </div>
          {inspectionStatus === "current" ? (
            <StatusBadge
              icon={CircleCheck}
              status="Ready"
              className="bg-status-ok text-status-ok-foreground hover:bg-status-ok"
            />
          ) : inspectionStatus === "overdue" ? (
            <StatusBadge
              icon={CircleAlert}
              status="Overdue"
              className="bg-status-overdue text-status-overdue-foreground hover:bg-status-overdue"
            />
          ) : inspectionStatus === "expired" ? (
            <StatusBadge
              icon={CircleX}
              status="Expired"
              className="bg-status-expired text-status-expired-foreground hover:bg-status-expired"
            />
          ) : (
            <StatusBadge
              icon={Clock}
              status="Never Inspected"
              className="bg-status-never text-status-never-foreground hover:bg-status-never"
            />
          )}
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium">Alerts</span>
          </div>
          {groupedActiveAlerts.some((g) => g.alertLevel === "URGENT") ? (
            <StatusBadge
              icon={ShieldX}
              status="Urgent Alerts Present"
              className="bg-urgent text-urgent-foreground hover:bg-urgent"
            />
          ) : groupedActiveAlerts.some((g) => g.alertLevel === "INFO") ? (
            <StatusBadge
              icon={ShieldAlert}
              status="Alerts Present"
              className="bg-important text-important-foreground hover:bg-important"
            />
          ) : (
            <StatusBadge
              icon={ShieldCheck}
              status="No Alerts"
              className="bg-status-ok text-status-ok-foreground hover:bg-status-ok"
            />
          )}
        </div>
      </div>
    </BasicCard>
  );
}

function ConsumablesTable({ consumables }: { consumables: Consumable[] }) {
  const columns = useMemo<ColumnDef<Consumable>[]>(
    () => [
      {
        accessorKey: "product.name",
        header: ({ column, table }) => (
          <DataTableColumnHeader column={column} table={table} />
        ),
      },
      {
        accessorKey: "expiresOn",
        header: ({ column, table }) => (
          <DataTableColumnHeader column={column} table={table} />
        ),
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
        header: ({ column, table }) => (
          <DataTableColumnHeader column={column} table={table} />
        ),
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

function AlertsTable({ alerts }: { alerts: Alert[] }) {
  const columns = useMemo<ColumnDef<Alert>[]>(
    () => [
      {
        accessorKey: "createdOn",
        id: "date",
        header: ({ column, table }) => (
          <DataTableColumnHeader column={column} table={table} />
        ),
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
        accessorKey: "alertLevel",
        header: ({ column, table }) => (
          <DataTableColumnHeader column={column} table={table} />
        ),
      },
      {
        accessorKey: "resolved",
        header: ({ column, table }) => (
          <DataTableColumnHeader column={column} table={table} />
        ),
        cell: ({ getValue }) => {
          const value = getValue() as boolean;
          return value ? (
            <Check className="text-green-500 size-5" />
          ) : (
            <X className="text-red-500 size-5" />
          );
        },
      },
      {
        id: "view",
        cell: ({ row }) => (
          <AssetInspectionAlert
            assetId={row.original.assetId}
            alertId={row.original.id}
            trigger={
              <Button variant="secondary" size="sm">
                View
              </Button>
            }
          />
        ),
      },
    ],
    []
  );

  return (
    <>
      <DataTable
        columns={columns}
        data={alerts.sort((a, b) =>
          isAfter(b.createdOn, a.createdOn) ? 1 : -1
        )}
        searchPlaceholder="Search alerts..."
      />
    </>
  );
}
