import type { ColumnDef } from "@tanstack/react-table";
import { CornerDownRight, Factory, MoreHorizontal, Trash } from "lucide-react";
import { useMemo } from "react";
import { Link, useNavigate } from "react-router";
import { api } from "~/.server/api";
import { requireUserSession } from "~/.server/sessions";
import ActiveIndicator2 from "~/components/active-indicator-2";
import ConfirmationDialog from "~/components/confirmation-dialog";
import { DataTable } from "~/components/data-table/data-table";
import { DataTableColumnHeader } from "~/components/data-table/data-table-column-header";
import LinkPreview from "~/components/link-preview";
import CustomTag from "~/components/products/custom-tag";
import NewManufacturerButton from "~/components/products/edit-manufacturer-button";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import useDeleteAction from "~/hooks/use-delete-action";
import { useModalSubmit } from "~/hooks/use-modal-submit";
import type { Manufacturer } from "~/lib/models";
import type { QueryParams } from "~/lib/urls";
import { isGlobalAdmin } from "~/lib/users";
import { getSearchParam } from "~/lib/utils";
import type { Route } from "./+types/index";

export async function loader({ request }: Route.LoaderArgs) {
  const { user } = await requireUserSession(request);

  const showAllProducts = getSearchParam(request, "show-all");

  let onlyMyManufacturers = showAllProducts !== "true";
  if (!showAllProducts && isGlobalAdmin(user)) {
    onlyMyManufacturers = false;
  }

  const query = { limit: 10000 } as QueryParams;

  if (onlyMyManufacturers) {
    query.client = {
      externalId: user.clientId,
    };
  }
  return api.manufacturers
    .list(request, query)
    .mapTo((manufacturersResponse) => ({
      manufacturers: manufacturersResponse.results,
      onlyMyManufacturers,
    }));
}

export default function ProductManufacturers({
  loaderData: { manufacturers, onlyMyManufacturers },
}: Route.ComponentProps) {
  const { submit: submitDelete } = useModalSubmit({
    defaultErrorMessage: "Error: Failed to delete manufacturer",
  });
  const navigate = useNavigate();

  const [deleteAction, setDeleteAction] = useDeleteAction();

  const setOnlyMyManufacturers = (value: boolean) => {
    navigate(`?show-all=${!value}`);
  };

  const columns: ColumnDef<Manufacturer>[] = useMemo(
    () => [
      {
        accessorKey: "active",
        header: ({ column, table }) => (
          <DataTableColumnHeader column={column} table={table} />
        ),
        cell: ({ getValue }) => <ActiveIndicator2 active={!!getValue()} />,
      },
      {
        accessorKey: "name",
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
        accessorKey: "homeUrl",
        header: ({ column, table }) => (
          <DataTableColumnHeader column={column} table={table} />
        ),

        cell: ({ getValue }) => {
          const value = getValue() as string;
          return value ? (
            <LinkPreview url={value} className="line-clamp-2" />
          ) : (
            <>&mdash;</>
          );
        },
      },
      {
        accessorKey: "_count.products",
        id: "products",
        header: ({ column, table }) => (
          <DataTableColumnHeader column={column} table={table} />
        ),
      },
      {
        accessorKey: "client.name",
        id: "owner",
        header: ({ column, table }) => (
          <DataTableColumnHeader column={column} table={table} />
        ),
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
                  onSelect={() =>
                    setDeleteAction((draft) => {
                      draft.open = true;
                      draft.title = "Delete Manufacturer";
                      draft.message = `Are you sure you want to delete ${
                        manufacturer.name || manufacturer.id
                      }?`;
                      draft.requiredUserInput =
                        manufacturer.name || manufacturer.id;
                      draft.action = () => {
                        submitDelete(
                          {},
                          {
                            method: "delete",
                            action: `/api/proxy/manufacturers/${manufacturer.id}?_throw=false`,
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
    [submitDelete, setDeleteAction]
  );
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>
            <Factory /> Manufacturers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={manufacturers}
            searchPlaceholder="Search manufacturers..."
            externalFilters={[
              <div
                key="onlyMyManufacturers"
                className="flex items-center space-x-2"
              >
                <Switch
                  id="onlyMyProducts"
                  checked={onlyMyManufacturers}
                  onCheckedChange={(checked) => setOnlyMyManufacturers(checked)}
                />
                <Label htmlFor="onlyMyProducts">Only My Products</Label>
              </div>,
            ]}
            actions={[<NewManufacturerButton key="add" />]}
          />
        </CardContent>
      </Card>
      <ConfirmationDialog
        open={deleteAction.open}
        onOpenChange={(open) =>
          setDeleteAction((draft) => {
            draft.open = open;
          })
        }
        destructive
        onConfirm={() => deleteAction.action()}
        confirmText="Delete"
        onCancel={() => deleteAction.cancel()}
        requiredUserInput={deleteAction.requiredUserInput}
        title={deleteAction.title}
        message={deleteAction.message}
      />
    </>
  );
}
