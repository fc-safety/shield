import { type ColumnDef } from "@tanstack/react-table";
import { format, formatDistanceToNow } from "date-fns";
import { BellRing } from "lucide-react";
import { useMemo, useState } from "react";
import { useAuth } from "~/contexts/auth-context";
import type { Asset, Inspection } from "~/lib/models";
import { can } from "~/lib/users";
import { DataTable } from "../data-table/data-table";
import { DataTableColumnHeader } from "../data-table/data-table-column-header";
import { ResponsiveDialog } from "../responsive-dialog";
import { SendNotificationsForm } from "../send-notifications-form";
import { Button } from "../ui/button";
import AssetInspectionDialog from "./asset-inspection-dialog";

interface AssetHistoryLogsProps {
  inspections: Inspection[];
  asset: Asset;
}

export default function AssetInspections({
  inspections,
  asset,
}: AssetHistoryLogsProps) {
  const { user } = useAuth();
  const canSendNotificationsToTeam =
    can(user, "read", "users") && can(user, "notify", "users");

  const columns: ColumnDef<Inspection>[] = useMemo(
    () => [
      {
        accessorKey: "createdOn",
        id: "date",
        header: ({ column, table }) => (
          <DataTableColumnHeader column={column} table={table} />
        ),
        cell: ({ getValue }) => (
          <span title={format(getValue() as string, "PPpp")}>
            {formatDistanceToNow(getValue() as string, {
              addSuffix: true,
              includeSeconds: true,
            })}
          </span>
        ),
      },
      {
        id: "inspector",
        accessorFn: (row) =>
          `${row.inspector?.firstName} ${row.inspector?.lastName}`,
        header: ({ column, table }) => (
          <DataTableColumnHeader column={column} table={table} />
        ),
      },
      {
        accessorKey: "comments",
        header: ({ column, table }) => (
          <DataTableColumnHeader column={column} table={table} />
        ),
        cell: ({ getValue }) => getValue() || <>&mdash;</>,
      },
      {
        id: "details",
        cell: ({ row }) => (
          <AssetInspectionDialog inspectionId={row.original.id} />
        ),
      },
    ],
    []
  );

  return (
    <DataTable
      data={inspections}
      columns={columns}
      initialState={{
        sorting: [
          {
            id: "date",
            desc: true,
          },
        ],
      }}
      actions={
        canSendNotificationsToTeam
          ? [<NotifyTeamButton key="notify-team" asset={asset} />]
          : undefined
      }
    />
  );
}

function NotifyTeamButton({ asset }: { asset: Asset }) {
  const [open, setOpen] = useState(false);

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={setOpen}
      title={
        <span className="flex items-center gap-2">
          <BellRing className="size-4" /> Notify Your Team
        </span>
      }
      description="Send an inspection reminder notification to select users on your team."
      trigger={
        <Button size="sm">
          <BellRing /> Notify Team
        </Button>
      }
    >
      <div className="mt-4">
        <SendNotificationsForm
          siteExternalId={asset.site?.externalId}
          endpointPath={`/api/proxy/assets/${asset.id}/send-reminder-notifications`}
          onSent={() => setOpen(false)}
        />
      </div>
    </ResponsiveDialog>
  );
}
