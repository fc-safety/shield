import type { ColumnDef } from "@tanstack/react-table";
import { ChevronRight, MoreHorizontal, Pencil, PhoneCall, Star, Trash } from "lucide-react";
import { Link, type To } from "react-router";
import type { ViewContext } from "~/.server/api-utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { useAuth } from "~/contexts/auth-context";
import useConfirmAction from "~/hooks/use-confirm-action";
import { useModalFetcher } from "~/hooks/use-modal-fetcher";
import { useOpenData } from "~/hooks/use-open-data";
import type { Site } from "~/lib/models";
import { can } from "~/lib/users";
import { beautifyPhone, cn } from "~/lib/utils";
import ConfirmationDialog from "../confirmation-dialog";
import { DataTable } from "../data-table/data-table";
import { DataTableColumnHeader } from "../data-table/data-table-column-header";
import { Button } from "../ui/button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "../ui/hover-card";
import EditSiteButton from "./edit-site-button";

interface SitesTableProps {
  clientId: string;
  sites: Site[];
  parentSiteId?: string;
  buildToSite: (id: string) => To;
  viewContext?: ViewContext;
}

export default function SitesTable({
  sites,
  clientId,
  parentSiteId,
  buildToSite,
  viewContext,
}: SitesTableProps) {
  const { user } = useAuth();
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
                  canExpand ? "text-primary" : "text-transparent",
                  isExpanded && "rotate-90"
                )}
              />
            </button>
            {depth > 0 && (
              <div>
                {Array.from({ length: depth }).map((_, index) => (
                  <div className="w-4"></div>
                ))}
              </div>
            )}
            <Link
              to={buildToSite(row.original.id)}
              className="inline-flex items-center gap-1 hover:underline"
            >
              {getValue() as string}
              {row.original.primary && (
                <Star size={14} fill="currentColor" className="text-primary" />
              )}
            </Link>
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
      id: "actions",
      cell: ({ row }) => {
        const site = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem disabled={!canUpdateSite} onSelect={() => editSite.openData(site)}>
                <Pencil />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                disabled={!canDeleteSite}
                onSelect={() =>
                  setDeleteAction((draft) => {
                    draft.open = true;
                    draft.title = "Delete Site";
                    draft.message = `Are you sure you want to delete ${site.name || site.id}?`;
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
                  })
                }
              >
                <Trash />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
              viewContext={viewContext}
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
        viewContext={viewContext}
      />
      <ConfirmationDialog {...deleteAction} />
    </>
  );
}
