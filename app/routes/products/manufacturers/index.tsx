import type { ColumnDef } from "@tanstack/react-table";
import { CornerDownRight, Factory, Trash, type LucideIcon } from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router";
import { api } from "~/.server/api";
import ActiveIndicator2 from "~/components/active-indicator-2";
import ActiveToggle from "~/components/active-toggle";
import ResponsiveActions from "~/components/common/responsive-actions";
import ConfirmationDialog from "~/components/confirmation-dialog";
import { DataTable } from "~/components/data-table/data-table";
import { DataTableColumnHeader } from "~/components/data-table/data-table-column-header";
import LinkPreview from "~/components/link-preview";
import CustomTag from "~/components/products/custom-tag";
import NewManufacturerButton from "~/components/products/edit-manufacturer-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { useAuth } from "~/contexts/auth-context";
import useConfirmAction from "~/hooks/use-confirm-action";
import { useModalFetcher } from "~/hooks/use-modal-fetcher";
import type { Manufacturer } from "~/lib/models";
import { CAPABILITIES } from "~/lib/permissions";
import type { QueryParams } from "~/lib/urls";
import { can, isGlobalAdmin } from "~/lib/users";
import type { Route } from "./+types/index";

export async function loader({ request }: Route.LoaderArgs) {
  const query = { limit: 10000, clientId: "_NULL" } as QueryParams;

  return api.manufacturers.list(request, query).then((manufacturersResponse) => ({
    manufacturers: manufacturersResponse.results,
  }));
}

export default function ProductManufacturers({
  loaderData: { manufacturers },
}: Route.ComponentProps) {
  const { user } = useAuth();

  const userIsGlobalAdmin = isGlobalAdmin(user);
  const hasConfigureProducts = can(user, CAPABILITIES.CONFIGURE_PRODUCTS);

  return (
    <div className="grid gap-4">
      <ManufacturersCard
        title="Global Manufacturers"
        description="Manufacturers accessible to all clients."
        TitleIcon={Factory}
        manufacturers={manufacturers}
        canCreate={hasConfigureProducts && userIsGlobalAdmin}
        canDelete={hasConfigureProducts && userIsGlobalAdmin}
        canUpdate={hasConfigureProducts && userIsGlobalAdmin}
      />
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
}: {
  manufacturers: Manufacturer[];
  title: string;
  description?: string;
  canCreate: boolean;
  canDelete: boolean;
  TitleIcon?: LucideIcon;
  showOwner?: boolean;
  canUpdate: boolean;
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
            <ActiveToggle active={isActive} path={getResourcePath(category)} />
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
            <ResponsiveActions
              actionGroups={[
                {
                  key: "actions",
                  actions: [
                    {
                      key: "details",
                      text: "Details",
                      Icon: CornerDownRight,
                      linkTo: manufacturer.id,
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
                      disabled: !canDelete,
                      onAction: () => {
                        setDeleteAction((draft) => {
                          draft.open = true;
                          draft.title = "Delete Manufacturer";
                          draft.message = `Are you sure you want to delete ${manufacturer.name || manufacturer.id}?`;
                          draft.requiredUserInput = manufacturer.name || manufacturer.id;
                          draft.onConfirm = () => {
                            submitDelete(
                              {},
                              {
                                method: "delete",
                                path: `/api/proxy/manufacturers/${manufacturer.id}`,
                              }
                            );
                          };
                        });
                      },
                    },
                  ],
                },
              ]}
            />
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
            actions={canCreate ? [<NewManufacturerButton key="add" />] : undefined}
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
