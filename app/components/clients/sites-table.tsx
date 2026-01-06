import type { ColumnDef } from "@tanstack/react-table";
import { ChevronRight, Circle, Pencil, PhoneCall, Star, Trash } from "lucide-react";
import { type To } from "react-router";
import { useAuth } from "~/contexts/auth-context";
import { useViewContext } from "~/contexts/view-context";
import useConfirmAction from "~/hooks/use-confirm-action";
import { useModalFetcher } from "~/hooks/use-modal-fetcher";
import { useOpenData } from "~/hooks/use-open-data";
import type { Site } from "~/lib/models";
import { can } from "~/lib/users";
import { beautifyPhone, cn } from "~/lib/utils";
import ResponsiveActions from "../common/responsive-actions";
import ConfirmationDialog from "../confirmation-dialog";
import { DataTable } from "../data-table/data-table";
import { DataTableColumnHeader } from "../data-table/data-table-column-header";
import { Button } from "../ui/button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "../ui/hover-card";
import EditSiteButton from "./edit-site-button";

interface SitesTableProps {
  clientId?: string;
  sites: Site[];
  parentSiteId?: string;
  buildToSite: (id: string) => To;
}

export default function SitesTable({
  sites,
  clientId,
  parentSiteId,
  buildToSite,
}: SitesTableProps) {
  const { user } = useAuth();
  const viewContext = useViewContext();
  const canCreateSite = can(user, "create", "sites");
  const canUpdateSite = can(user, "update", "sites");
  const canDeleteSite = can(user, "delete", "sites");

  const editSite = useOpenData<Site>();

  const [deleteAction, setDeleteAction] = useConfirmAction({
    variant: "destructive",
  });
  const { submitJson: submitDelete } = useModalFetcher();

  const columns: ColumnDef<Site>[] = [
    {
      accessorKey: "name",
      header: ({ column, table }) => <DataTableColumnHeader column={column} table={table} />,

      cell: ({ row, getValue }) => {
        const canExpand = row.getCanExpand();
        const isExpanded = row.getIsExpanded();
        const depth = row.depth;
        return (
          <div className="flex items-center gap-1">
            <button onClick={row.getToggleExpandedHandler()} disabled={!canExpand}>
              <ChevronRight
                className={cn(
                  "size-4 transition-transform",
                  canExpand ? "text-secondary-foreground" : "text-transparent",
                  isExpanded && "rotate-90"
                )}
              />
            </button>
            {depth > 0 && (
              <div>
                {Array.from({ length: depth }).map((_, index) => (
                  <div className="w-4" key={index}></div>
                ))}
              </div>
            )}
            <span className="inline-flex items-center gap-1">
              {row.original.primary ? (
                <div title="This site is the primary site for the client.">
                  <Star
                    size={14}
                    fill={row.original.active ? "currentColor" : "none"}
                    className={cn(row.original.active ? "text-primary" : "text-muted-foreground")}
                  />
                </div>
              ) : (
                <div
                  title={row.original.active ? "This site is active." : "This site is inactive."}
                >
                  <Circle
                    size={10}
                    fill={row.original.active ? "currentColor" : "none"}
                    className={cn(row.original.active ? "text-primary" : "text-muted-foreground")}
                  />
                </div>
              )}
              <div className={cn(!row.original.active && "text-muted-foreground line-through")}>
                {getValue() as string}
              </div>
            </span>
          </div>
        );
      },
    },
    {
      accessorFn: (data) => `${data.address.city}, ${data.address.state}`,
      id: "city",
      header: ({ column, table }) => <DataTableColumnHeader column={column} table={table} />,
    },
    {
      accessorFn: (data) => beautifyPhone(data.phoneNumber),
      id: "phone",
      header: ({ column, table }) => <DataTableColumnHeader column={column} table={table} />,

      cell: ({ row, getValue }) => (
        <HoverCard>
          <HoverCardTrigger>{getValue() as string}</HoverCardTrigger>
          <HoverCardContent>
            <Button variant="link" asChild>
              <a href={`tel:${row.original.phoneNumber}`}>
                <PhoneCall />
                Call {getValue() as string}
              </a>
            </Button>
          </HoverCardContent>
        </HoverCard>
      ),
    },
    {
      accessorFn: (data) => data._count?.assets ?? -1,
      id: "assets",
      header: ({ column, table }) => <DataTableColumnHeader column={column} table={table} />,

      cell: ({ row, getValue }) => {
        const count = getValue() as number;
        return count > -1 ? count : <>&mdash;</>;
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const site = row.original;

        return (
          <ResponsiveActions
            actionGroups={[
              {
                key: "actions",
                actions: [
                  {
                    key: "edit",
                    text: "Edit",
                    Icon: Pencil,
                    onAction: () => editSite.openData(site),
                    disabled: !canUpdateSite,
                  },
                ],
              },
              {
                key: "destructive-actions",
                variant: "destructive",
                actions: [
                  {
                    key: "delete",
                    text: "Delete",
                    Icon: Trash,
                    onAction: () =>
                      setDeleteAction((draft) => {
                        draft.open = true;
                        draft.title = "Delete Site";
                        draft.message = (
                          <div className="space-y-2">
                            <div>Are you sure you want to delete {site.name || site.id}?</div>
                            <div className="italic">
                              It is <span className="font-bold">recommended to deactivate</span> the
                              site instead.
                            </div>
                          </div>
                        );
                        draft.requiredUserInput = site.name || site.id;
                        draft.onConfirm = () => {
                          submitDelete(
                            {},
                            {
                              method: "delete",
                              path: `/api/proxy/sites/${site.id}`,
                              viewContext,
                            }
                          );
                        };
                      }),
                    disabled: !canDeleteSite,
                  },
                ],
              },
            ]}
          />
        );
      },
    },
  ];

  return (
    <>
      <DataTable
        data={sites}
        columns={columns}
        searchPlaceholder="Search sites..."
        getSubRows={(originalRow) => originalRow.subsites}
        initialState={{
          expanded: true,
        }}
        actions={[
          canCreateSite ? (
            <EditSiteButton
              key="add"
              clientId={clientId}
              parentSiteId={parentSiteId}
            />
          ) : null,
        ]}
      />
      <EditSiteButton
        clientId={clientId}
        trigger={null}
        site={editSite.data ?? undefined}
        open={editSite.open}
        onOpenChange={editSite.setOpen}
        parentSiteId={parentSiteId}
      />
      <ConfirmationDialog {...deleteAction} />
    </>
  );
}
