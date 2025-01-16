import type { ColumnDef } from "@tanstack/react-table";
import { CornerDownRight, MoreHorizontal, Trash } from "lucide-react";
import { useMemo } from "react";
import { Link, useFetcher } from "react-router";
import { useImmer } from "use-immer";
import type { z } from "zod";
import { api } from "~/.server/api";
import ActiveIndicator2 from "~/components/active-indicator-2";
import ConfirmationDialog from "~/components/confirmation-dialog";
import { DataTable } from "~/components/data-table/data-table";
import { DataTableColumnHeader } from "~/components/data-table/data-table-column-header";
import LinkPreview from "~/components/link-preview";
import NewManufacturerButton from "~/components/products/edit-manufacturer-button";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import type { Manufacturer } from "~/lib/models";
import {
  createManufacturerSchemaResolver,
  type createManufacturerSchema,
} from "~/lib/schema";
import { getValidatedFormDataOrThrow } from "~/lib/utils";
import type { Route } from "./+types/index";

export const action = async ({ request }: Route.ActionArgs) => {
  const { data } = await getValidatedFormDataOrThrow<
    z.infer<typeof createManufacturerSchema>
  >(request, createManufacturerSchemaResolver);

  return api.manufacturers.create(request, data);
};

export function loader({ request }: Route.LoaderArgs) {
  return api.manufacturers.list(request, { limit: 10000 });
}

export default function ProductManufacturers({
  loaderData: manufacturers,
}: Route.ComponentProps) {
  const fetcher = useFetcher();

  const [deleteAction, setDeleteAction] = useImmer({
    open: false,
    action: () => {},
    cancel: () => {},
    title: "Are you sure?",
    message: "",
    requiredUserInput: "",
  });

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
                        fetcher.submit(
                          {},
                          {
                            method: "delete",
                            action: `/products/manufacturers/${manufacturer.id}`,
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
    [fetcher, setDeleteAction]
  );
  return (
    <>
      <DataTable
        columns={columns}
        data={manufacturers.results}
        searchPlaceholder="Search manufacturers..."
        actions={[<NewManufacturerButton key="add" />]}
      />
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
