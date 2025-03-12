import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { Copy, Nfc, Pencil, Trash } from "lucide-react";
import { useCallback, useMemo } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { api } from "~/.server/api";
import { config } from "~/.server/config";
import EditTagButton from "~/components/assets/edit-tag-button";
import ConfirmationDialog from "~/components/confirmation-dialog";
import { DataTable } from "~/components/data-table/data-table";
import { DataTableColumnHeader } from "~/components/data-table/data-table-column-header";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { useAuth } from "~/contexts/auth-context";
import useConfirmAction from "~/hooks/use-confirm-action";
import { useModalFetcher } from "~/hooks/use-modal-fetcher";
import { useOpenData } from "~/hooks/use-open-data";
import type { Tag } from "~/lib/models";
import { buildUrl } from "~/lib/urls";
import { can } from "~/lib/users";
import type { Route } from "./+types/index";

export function loader({ request }: Route.LoaderArgs) {
  return api.tags
    .list(request, { limit: 10000 }, { context: "admin" })
    .mapTo((tags) => ({
      tags,
      appHost: config.APP_HOST,
    }));
}

export default function AdminTagsIndex({
  loaderData: { tags, appHost },
}: Route.ComponentProps) {
  const { user } = useAuth();

  const canCreate = useMemo(() => can(user, "create", "tags"), [user]);
  const canUpdate = useMemo(() => can(user, "update", "tags"), [user]);
  const canDelete = useMemo(() => can(user, "delete", "tags"), [user]);

  const editTag = useOpenData<Tag>();

  const { submit: submitDelete } = useModalFetcher({
    defaultErrorMessage: "Error: Failed to delete tag",
  });
  const [deleteAction, setDeleteAction] = useConfirmAction({
    variant: "destructive",
  });

  const copyUrlForTagExternalId = useCallback(
    (extId: string) => {
      const url = buildUrl("/inspect", appHost, {
        extId,
      });
      navigator.clipboard.writeText(url.toString()).then(() => {
        toast.success("Copied inspection URL to clipboard!");
      });
    },
    [appHost]
  );

  const columns: ColumnDef<Tag>[] = useMemo(
    () => [
      {
        accessorKey: "serialNumber",
        cell: ({ row, getValue }) => (
          <Link to={row.original.id} className="hover:underline">
            {getValue() as string}
          </Link>
        ),
        header: ({ column, table }) => (
          <DataTableColumnHeader column={column} table={table} />
        ),
      },
      {
        accessorKey: "asset.name",
        id: "assigned asset",
        header: ({ column, table }) => (
          <DataTableColumnHeader column={column} table={table} />
        ),
        cell: ({ getValue }) => getValue() ?? <>&mdash;</>,
      },
      {
        accessorKey: "asset.setupOn",
        id: "setup on",
        header: ({ column, table }) => (
          <DataTableColumnHeader column={column} table={table} />
        ),
        cell: ({ getValue }) => {
          const value = getValue() as Date;
          return value ? format(value, "PPpp") : <>&mdash;</>;
        },
      },
      {
        accessorKey: "client.name",
        id: "assigned client",
        header: ({ column, table }) => (
          <DataTableColumnHeader column={column} table={table} />
        ),
        cell: ({ getValue }) => getValue() ?? <>&mdash;</>,
      },
      {
        accessorKey: "site.name",
        id: "assigned site",
        header: ({ column, table }) => (
          <DataTableColumnHeader column={column} table={table} />
        ),
        cell: ({ getValue }) => getValue() ?? <>&mdash;</>,
      },
      {
        accessorKey: "externalId",
        id: "inspection link",
        header: ({ column, table }) => (
          <DataTableColumnHeader column={column} table={table} />
        ),
        cell: ({ getValue, row }) => {
          const tag = row.original;
          return (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => copyUrlForTagExternalId(getValue() as string)}
              title={tag.asset ? "Copy inspection link" : "No asset assigned"}
            >
              <Copy />
              Copy
            </Button>
          );
        },
      },
      {
        id: "actions",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="secondary"
              onClick={() => editTag.openData(row.original)}
              disabled={!canUpdate}
            >
              <Pencil />
            </Button>
            <Button
              size="icon"
              variant="destructive"
              onClick={() =>
                setDeleteAction((draft) => {
                  draft.open = true;
                  draft.title = "Delete tag";
                  draft.message = "Are you sure you want to delete this tag?";
                  draft.requiredUserInput = row.original.asset
                    ? row.original.serialNumber
                    : "";
                  draft.onConfirm = () => {
                    submitDelete(
                      {},
                      {
                        method: "delete",
                        action: `/api/proxy/tags/${row.original.id}`,
                      }
                    );
                  };
                })
              }
              disabled={!canDelete}
            >
              <Trash />
            </Button>
          </div>
        ),
      },
    ],
    [
      copyUrlForTagExternalId,
      canUpdate,
      canDelete,
      editTag,
      submitDelete,
      setDeleteAction,
    ]
  );

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>
            <Nfc /> Tags
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={tags.results}
            searchPlaceholder="Search tags..."
            actions={
              canCreate
                ? [<EditTagButton key="add" viewContext="admin" />]
                : undefined
            }
            initialState={{
              columnVisibility: {
                actions: canUpdate || canDelete,
              },
            }}
          />
        </CardContent>
      </Card>
      <EditTagButton
        tag={editTag.data ?? undefined}
        open={editTag.open}
        onOpenChange={editTag.setOpen}
        trigger={<></>}
        viewContext="admin"
      />
      <ConfirmationDialog {...deleteAction} />
    </>
  );
}
