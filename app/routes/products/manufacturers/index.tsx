import type { ColumnDef } from "@tanstack/react-table";
import {
  Building2,
  CornerDownRight,
  Factory,
  Globe2,
  MoreHorizontal,
  Trash,
  type LucideIcon,
} from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router";
import { api } from "~/.server/api";
import type { ViewContext } from "~/.server/api-utils";
import ActiveIndicator2 from "~/components/active-indicator-2";
import ActiveToggle from "~/components/active-toggle";
import ConfirmationDialog from "~/components/confirmation-dialog";
import { DataTable } from "~/components/data-table/data-table";
import { DataTableColumnHeader } from "~/components/data-table/data-table-column-header";
import LinkPreview from "~/components/link-preview";
import CustomTag from "~/components/products/custom-tag";
import NewManufacturerButton from "~/components/products/edit-manufacturer-button";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
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
import type { Manufacturer } from "~/lib/models";
import type { QueryParams } from "~/lib/urls";
import { can, isGlobalAdmin } from "~/lib/users";
import type { Route } from "./+types/index";

export async function loader({ request }: Route.LoaderArgs) {
  const query = { limit: 10000 } as QueryParams;

  return api.manufacturers.list(request, query).then((manufacturersResponse) => ({
    manufacturers: manufacturersResponse.results,
  }));
}

export default function ProductManufacturers({
  loaderData: { manufacturers },
}: Route.ComponentProps) {
  const { user } = useAuth();

  const userIsGlobalAdmin = isGlobalAdmin(user);
  const hasCreatePermission = can(user, "create", "manufacturers");
  const hasDeletePermission = can(user, "delete", "manufacturers");
  const hasUpdatePermission = can(user, "update", "manufacturers");

  const [globalManufacturers, clientManufacturers, myManufacturers] = useMemo(() => {
    const globalManufacturers: Manufacturer[] = [];
    const clientManufacturers: Manufacturer[] = [];
    const myManufacturers: Manufacturer[] = [];

    manufacturers.forEach((manufacturer) => {
      if (manufacturer.clientId !== null) {
        if (manufacturer.client?.externalId === user.clientId) {
          myManufacturers.push(manufacturer);
        } else {
          clientManufacturers.push(manufacturer);
        }
      } else {
        globalManufacturers.push(manufacturer);
      }
    });

    return [globalManufacturers, clientManufacturers, myManufacturers];
  }, [manufacturers, user.clientId]);

  return (
    <div className="grid gap-4">
      <ManufacturersCard
        title="My Manufacturers"
        description="These are manufacturers that either you or someone in your organization has created."
        TitleIcon={Factory}
        manufacturers={myManufacturers}
        canCreate={hasCreatePermission}
        canDelete={hasDeletePermission}
        canUpdate={hasUpdatePermission}
        viewContext="user"
      />
      <ManufacturersCard
        title="Global Manufacturers"
        description="These are manufacturers that anyone can use."
        TitleIcon={Globe2}
        manufacturers={globalManufacturers}
        canCreate={hasCreatePermission && userIsGlobalAdmin}
        canDelete={hasDeletePermission && userIsGlobalAdmin}
        canUpdate={hasUpdatePermission && userIsGlobalAdmin}
        viewContext={userIsGlobalAdmin ? "admin" : "user"}
      />
      {isGlobalAdmin(user) && (
        <ManufacturersCard
          title="Client Manufacturers"
          description="These are manufacturers that have been created by other clients."
          TitleIcon={Building2}
          manufacturers={clientManufacturers}
          canCreate={false}
          canDelete={userIsGlobalAdmin}
          canUpdate={hasUpdatePermission && userIsGlobalAdmin}
          viewContext={userIsGlobalAdmin ? "admin" : "user"}
          showOwner
        />
      )}{" "}
    </div>
  );
}

function ManufacturersCard({
  manufacturers,
  title,
  description,
  canCreate,
  canDelete,
  TitleIcon = Factory,
  showOwner = false,
  canUpdate,
  viewContext = "user",
}: {
  manufacturers: Manufacturer[];
  title: string;
  description?: string;
  canCreate: boolean;
  canDelete: boolean;
  TitleIcon?: LucideIcon;
  showOwner?: boolean;
  canUpdate: boolean;
  viewContext?: ViewContext;
}) {
  const { submitJson: submitDelete } = useModalFetcher({
    defaultErrorMessage: "Error: Failed to delete manufacturer",
  });

  const [deleteAction, setDeleteAction] = useConfirmAction({
    variant: "destructive",
  });

  const columns: ColumnDef<Manufacturer>[] = useMemo(
    () => [
      {
        accessorKey: "active",
        header: ({ column, table }) => <DataTableColumnHeader column={column} table={table} />,
        cell: ({ getValue, row }) => {
          const category = row.original;
          const isActive = getValue() as boolean;
          return canUpdate ? (
            <ActiveToggle
              active={isActive}
              path={getResourcePath(category)}
              viewContext={viewContext}
            />
          ) : (
            <ActiveIndicator2 active={isActive} />
          );
        },
      },
      {
        accessorKey: "name",
        cell: ({ row, getValue }) => (
          <Link to={row.original.id} className="hover:underline">
            {getValue() as string}
          </Link>
        ),
        header: ({ column, table }) => <DataTableColumnHeader column={column} table={table} />,
      },
      {
        accessorKey: "homeUrl",
        header: ({ column, table }) => <DataTableColumnHeader column={column} table={table} />,

        cell: ({ getValue }) => {
          const value = getValue() as string;
          return value ? <LinkPreview url={value} className="line-clamp-2" /> : <>&mdash;</>;
        },
      },
      {
        accessorKey: "_count.products",
        id: "products",
        header: ({ column, table }) => <DataTableColumnHeader column={column} table={table} />,
      },
      {
        accessorKey: "client.name",
        id: "owner",
        header: ({ column, table }) => <DataTableColumnHeader column={column} table={table} />,
        cell: ({ getValue }) =>
          getValue() ? <CustomTag text={getValue() as string} /> : <>&mdash;</>,
      },
      {
        id: "actions",
        cell: ({ row }) => {
          const manufacturer = row.original;

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {/* <DropdownMenuLabel>Actions</DropdownMenuLabel> */}
                <DropdownMenuItem asChild>
                  <Link to={manufacturer.id}>
                    <CornerDownRight />
                    Details
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  disabled={!canDelete}
                  onSelect={() =>
                    setDeleteAction((draft) => {
                      draft.open = true;
                      draft.title = "Delete Manufacturer";
                      draft.message = `Are you sure you want to delete ${
                        manufacturer.name || manufacturer.id
                      }?`;
                      draft.requiredUserInput = manufacturer.name || manufacturer.id;
                      draft.onConfirm = () => {
                        submitDelete(
                          {},
                          {
                            method: "delete",
                            path: `/api/proxy/manufacturers/${manufacturer.id}`,
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
    ],
    [submitDelete, setDeleteAction, canDelete]
  );
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>
            <TitleIcon /> {title}
          </CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={manufacturers}
            initialState={{
              columnVisibility: {
                owner: showOwner,
              },
              sorting: [
                { id: "active", desc: true },
                { id: "name", desc: false },
              ],
            }}
            searchPlaceholder="Search manufacturers..."
            actions={
              canCreate
                ? [<NewManufacturerButton key="add" viewContext={viewContext} />]
                : undefined
            }
          />
        </CardContent>
      </Card>
      <ConfirmationDialog {...deleteAction} />
    </>
  );
}

const getResourcePath = (manufacturer?: Manufacturer) => {
  return `/api/proxy/manufacturers/${manufacturer?.id ?? ""}`;
};
