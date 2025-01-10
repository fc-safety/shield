import NewAssetQuestionButton from "@/components/assets/new-asset-question-button";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import type { ColumnDef } from "@tanstack/react-table";
import { Power, PowerOff } from "lucide-react";
import type { AssetQuestion } from "~/lib/models";

interface AssetQuestionsTableProps {
  questions: AssetQuestion[];
  readOnly?: boolean;
}

export default function AssetQuestionsTable({
  questions,
  readOnly = false,
}: AssetQuestionsTableProps) {
  const columns: ColumnDef<AssetQuestion>[] = [
    {
      accessorKey: "active",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Active" />
      ),
      cell: ({ getValue }) =>
        getValue() ? (
          <Power className="size-4 text-primary" />
        ) : (
          <PowerOff className="size-4 text-muted-foreground" />
        ),
    },
    {
      accessorKey: "type",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Type" />
      ),
      cell: ({ getValue }) => (
        <span className="capitalize">
          {(getValue() as string).toLowerCase()}
        </span>
      ),
    },
    {
      accessorKey: "required",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Required" />
      ),
      cell: ({ getValue }) => (getValue() ? "Yes" : "No"),
    },
    {
      accessorKey: "prompt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Prompt" />
      ),
      cell: ({ getValue }) => (
        <span className="line-clamp-2">{getValue() as string}</span>
      ),
    },
    {
      accessorKey: "valueType",
      id: "answer type",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Answer Type" />
      ),
      cell: ({ getValue }) => (
        <span className="capitalize">
          {(getValue() as string).replace("_", " ").toLowerCase()}
        </span>
      ),
    },
  ];

  return (
    <>
      <DataTable
        data={questions}
        columns={columns}
        searchPlaceholder="Search questions..."
        actions={readOnly ? [] : [<NewAssetQuestionButton key="add" />]}
      />
    </>
  );
}
