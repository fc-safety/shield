import NewAssetQuestionButton from "@/components/assets/new-asset-question-button";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Pencil, Trash } from "lucide-react";
import { useMemo } from "react";
import { useFetcher } from "react-router";
import useConfirmAction from "~/hooks/use-confirm-action";
import { useOpenData } from "~/hooks/use-open-data";
import type { AssetQuestion } from "~/lib/models";
import ActiveIndicator2 from "../active-indicator-2";
import AssetQuestionDetailForm from "../assets/asset-question-detail-form";
import ConfirmationDialog from "../confirmation-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";

interface AssetQuestionsTableProps {
  questions: AssetQuestion[];
  readOnly?: boolean;
  parentType: "product" | "productCategory";
  parentId: string;
}

export default function AssetQuestionsTable({
  questions,
  readOnly = false,
  parentType,
  parentId,
}: AssetQuestionsTableProps) {
  const editQuestion = useOpenData<AssetQuestion>();

  const fetcher = useFetcher();

  const [deleteAction, setDeleteAction] = useConfirmAction();

  const existingSetupQuestionsCount = useMemo(
    () => questions.filter((q) => q.type === "SETUP").length,
    [questions]
  );
  const existingInspectionQuestionsCount = useMemo(
    () => questions.filter((q) => q.type === "INSPECTION").length,
    [questions]
  );

  const columns: ColumnDef<AssetQuestion>[] = [
    {
      accessorKey: "active",
      header: ({ column, table }) => (
        <DataTableColumnHeader column={column} table={table} />
      ),
      cell: ({ getValue }) => <ActiveIndicator2 active={!!getValue()} />,
    },
    {
      accessorKey: "type",
      header: ({ column, table }) => (
        <DataTableColumnHeader column={column} table={table} />
      ),
      cell: ({ getValue }) => (
        <span className="capitalize">
          {(getValue() as string).toLowerCase()}
        </span>
      ),
    },
    {
      accessorKey: "required",
      header: ({ column, table }) => (
        <DataTableColumnHeader column={column} table={table} />
      ),
      cell: ({ getValue }) => (getValue() ? "Yes" : "No"),
    },
    {
      accessorKey: "prompt",
      header: ({ column, table }) => (
        <DataTableColumnHeader column={column} table={table} />
      ),
      cell: ({ getValue }) => (
        <span className="line-clamp-2">{getValue() as string}</span>
      ),
    },
    {
      accessorKey: "valueType",
      id: "answer type",
      header: ({ column, table }) => (
        <DataTableColumnHeader column={column} table={table} />
      ),
      cell: ({ getValue }) => (
        <span className="capitalize">
          {(getValue() as string).replace("_", " ").toLowerCase()}
        </span>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const question = row.original;

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
              <DropdownMenuItem
                onSelect={() => editQuestion.openData(question)}
              >
                <Pencil />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() =>
                  setDeleteAction((draft) => {
                    draft.open = true;
                    draft.title = "Delete Question";
                    draft.message = `Are you sure you want to delete the question "${question.prompt}"?`;
                    draft.onConfirm = () => {
                      fetcher.submit(
                        {},
                        {
                          method: "delete",
                          action: `?action=delete-asset-question&questionId=${question.id}`,
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
        data={questions}
        columns={columns}
        searchPlaceholder="Search questions..."
        initialState={{
          columnVisibility: {
            actions: !readOnly,
          },
        }}
        actions={
          readOnly
            ? []
            : [
                <NewAssetQuestionButton
                  key="add"
                  existingSetupQuestionsCount={existingSetupQuestionsCount}
                  existingInspectionQuestionsCount={
                    existingInspectionQuestionsCount
                  }
                  parentType={parentType}
                  parentId={parentId}
                />,
              ]
        }
      />
      <ConfirmationDialog
        open={deleteAction.open}
        onOpenChange={(open) =>
          setDeleteAction((draft) => {
            draft.open = open;
          })
        }
        destructive
        onConfirm={() => deleteAction.onConfirm()}
        confirmText="Delete"
        onCancel={() => deleteAction.onCancel()}
        requiredUserInput={deleteAction.requiredUserInput}
        title={deleteAction.title}
        message={deleteAction.message}
      />
      <Dialog open={editQuestion.open} onOpenChange={editQuestion.setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Question</DialogTitle>
          </DialogHeader>
          <AssetQuestionDetailForm
            assetQuestion={editQuestion.data ?? undefined}
            onSubmitted={() => editQuestion.setOpen(false)}
            existingSetupQuestionsCount={existingSetupQuestionsCount}
            existingInspectionQuestionsCount={existingInspectionQuestionsCount}
            parentType={parentType}
            parentId={parentId}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
