import { useMutation } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Copy, Nfc, Pencil, Trash } from "lucide-react";
import { useCallback, useMemo } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { api } from "~/.server/api";
import { config } from "~/.server/config";
import EditTagButton from "~/components/assets/edit-tag-button";
import HydrationSafeFormattedDate from "~/components/common/hydration-safe-formatted-date";
import ConfirmationDialog from "~/components/confirmation-dialog";
import { DataTable } from "~/components/data-table/data-table";
import { DataTableColumnHeader } from "~/components/data-table/data-table-column-header";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { useAuth } from "~/contexts/auth-context";
import { useAuthenticatedFetch } from "~/hooks/use-authenticated-fetch";
import useConfirmAction from "~/hooks/use-confirm-action";
import { useModalFetcher } from "~/hooks/use-modal-fetcher";
import { useOpenData } from "~/hooks/use-open-data";
import type { Tag } from "~/lib/models";
import { CAPABILITIES } from "~/lib/permissions";
import { can } from "~/lib/users";
import { dedupById } from "~/lib/utils";
import type { Route } from "./+types/index";
import EditableAssetDisplay from "./components/editable-asset-display";
import TagAssistantButton from "./components/tag-assistant/tag-assistant-button";
import { generateSignedTagUrl } from "./services/tags.service";

export async function loader({ request }: Route.LoaderArgs) {
  return api.tags.list(request, { limit: 10000 }, { context: "admin" }).then((tags) => ({
    tags,
    appHost: config.APP_HOST,
  }));
}

export default function AdminTagsIndex({ loaderData: { tags, appHost } }: Route.ComponentProps) {
  const { user } = useAuth();

  const canProgram = useMemo(() => can(user, CAPABILITIES.PROGRAM_TAGS), [user]);
  const canUpdate = useMemo(() => can(user, CAPABILITIES.MANAGE_ASSETS), [user]);
  const canDelete = useMemo(() => can(user, CAPABILITIES.MANAGE_ASSETS), [user]);

  const editTag = useOpenData<Tag>();

  const { submitJson: submitDelete } = useModalFetcher({
    defaultErrorMessage: "Error: Failed to delete tag",
  });
  const [deleteAction, setDeleteAction] = useConfirmAction({
    variant: "destructive",
  });

  const { fetchOrThrow } = useAuthenticatedFetch();
  const { mutate: getGeneratedTagUrl } = useMutation({
    mutationFn: (options: { serialNumber: string; externalId: string }) =>
      generateSignedTagUrl(fetchOrThrow, options.serialNumber, options.externalId),
  });

  const copyUrlForTagExternalId = useCallback(
    (serialNumber: string, externalId: string) => {
      getGeneratedTagUrl(
        { serialNumber, externalId },
        {
          onSuccess: (data) => {
            toast.promise(navigator.clipboard.writeText(data.tagUrl), {
              loading: "Copying tag's inspection URL to clipboard...",
              success: "Copied tag's inspection URL to clipboard!",
              error: "Failed to copy tag's inspection URL to clipboard.",
            });
          },
        }
      );
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
        header: ({ column, table }) => <DataTableColumnHeader column={column} table={table} />,
      },
      {
        accessorFn: ({ asset }) =>
          asset?.name ||
          [asset?.product?.name, asset?.location, asset?.placement].filter(Boolean).join(" - "),
        id: "assigned asset",
        header: ({ column, table }) => <DataTableColumnHeader column={column} table={table} />,
        cell: ({ row }) => {
          const tag = row.original;
          return (
            <EditableAssetDisplay
              tag={tag}
              asset={tag.asset ?? undefined}
              key={`tag-row-${tag.id}`}
            />
          );
        },
      },
      {
        accessorFn: ({ asset }) => asset?.setupOn,
        id: "setup on",
        header: ({ column, table }) => <DataTableColumnHeader column={column} table={table} />,
        cell: ({ getValue }) => {
          const value = getValue() as Date;
          return value ? (
            <HydrationSafeFormattedDate date={value} formatStr="PPpp" />
          ) : (
            <>&mdash;</>
          );
        },
      },
      {
        accessorFn: ({ client }) => client?.name,
        id: "assigned client",
        header: ({ column, table }) => <DataTableColumnHeader column={column} table={table} />,
        cell: ({ getValue }) => getValue() ?? <>&mdash;</>,
      },
      {
        accessorFn: ({ site }) => site?.name,
        id: "assigned site",
        header: ({ column, table }) => <DataTableColumnHeader column={column} table={table} />,
        cell: ({ getValue }) => getValue() ?? <>&mdash;</>,
      },
      {
        accessorKey: "externalId",
        id: "inspection link",
        header: ({ column, table }) => <DataTableColumnHeader column={column} table={table} />,
        cell: ({ getValue, row }) => {
          const tag = row.original;
          return (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => copyUrlForTagExternalId(tag.serialNumber, getValue() as string)}
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
                  draft.requiredUserInput = row.original.asset ? row.original.serialNumber : "";
                  draft.onConfirm = () => {
                    submitDelete(
                      {},
                      {
                        method: "delete",
                        path: `/api/proxy/tags/${row.original.id}`,
                        viewContext: "admin",
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
    [copyUrlForTagExternalId, canUpdate, canDelete, editTag.openData, submitDelete, setDeleteAction]
  );

  const allClients = dedupById(
    tags.results.map((tag) => tag.client).filter((c): c is NonNullable<typeof c> => !!c)
  );

  const allSites = dedupById(
    tags.results.map((tag) => tag.site).filter((s): s is NonNullable<typeof s> => !!s)
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
            actions={canProgram ? [<TagAssistantButton key="tag-assistant" />] : undefined}
            initialState={{
              columnVisibility: {
                actions: canUpdate || canDelete,
              },
            }}
            filters={({ table }) => [
              {
                column: table.getColumn("assigned client"),
                options: allClients.map((client) => ({
                  label: client.name,
                  value: client.name,
                })),
                title: "Client",
              },
              {
                column: table.getColumn("assigned site"),
                options: allSites.map((site) => ({
                  label: site.name,
                  value: site.name,
                })),
                title: "Site",
              },
            ]}
          />
        </CardContent>
      </Card>
      <EditTagButton
        tag={editTag.data ?? undefined}
        open={editTag.open}
        onOpenChange={editTag.setOpen}
        trigger={null}
      />
      <ConfirmationDialog {...deleteAction} />
    </>
  );
}
