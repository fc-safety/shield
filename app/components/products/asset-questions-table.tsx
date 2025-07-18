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
import { isAfter } from "date-fns";
import {
  Calendar,
  Check,
  Copy,
  Hash,
  Image,
  MoreHorizontal,
  Pencil,
  Text,
  TextCursorInput,
  Trash,
  X,
} from "lucide-react";
import { useCallback, useMemo } from "react";
import type z from "zod";
import useConfirmAction from "~/hooks/use-confirm-action";
import { useModalFetcher } from "~/hooks/use-modal-fetcher";
import { useOpenData } from "~/hooks/use-open-data";
import { ASSET_QUESTION_TONES } from "~/lib/constants";
import type { AssetQuestion } from "~/lib/models";
import type { createAssetQuestionSchema } from "~/lib/schema";
import { cn } from "~/lib/utils";
import ActiveToggle from "../active-toggle";
import AssetQuestionDetailForm from "../assets/asset-question-detail-form";
import ConfirmationDialog from "../confirmation-dialog";
import SubmittingCheckbox from "../submitting-checkbox";
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

  const { submitJson: submitDelete } = useModalFetcher();
  const { submitJson: submitDuplicateQuestion } = useModalFetcher();

  const [deleteAction, setDeleteAction] = useConfirmAction();

  const existingSetupQuestionsCount = useMemo(
    () => questions.filter((q) => q.type === "SETUP").length,
    [questions]
  );
  const existingInspectionQuestionsCount = useMemo(
    () => questions.filter((q) => q.type === "INSPECTION").length,
    [questions]
  );

  const getResourcePath = useCallback(
    (question?: AssetQuestion) => {
      const resourceName = parentType === "product" ? "products" : "product-categories";
      return `/api/proxy/${resourceName}/${parentId}/questions/${question?.id ?? ""}`;
    },
    [parentType, parentId]
  );

  const columns = useMemo(
    (): ColumnDef<AssetQuestion>[] => [
      {
        accessorKey: "active",
        header: ({ column, table }) => <DataTableColumnHeader column={column} table={table} />,
        cell: ({ getValue, row }) => {
          const question = row.original;
          const isActive = getValue() as boolean;
          return <ActiveToggle active={isActive} path={getResourcePath(question)} />;
        },
      },
      {
        accessorKey: "type",
        header: ({ column, table }) => <DataTableColumnHeader column={column} table={table} />,
        cell: ({ getValue }) => (
          <span className="capitalize">{(getValue() as string).toLowerCase()}</span>
        ),
      },
      {
        accessorKey: "required",
        header: ({ column, table }) => <DataTableColumnHeader column={column} table={table} />,
        cell: ({ getValue, row }) => {
          const question = row.original;
          const isRequired = getValue() as boolean;
          return (
            <SubmittingCheckbox
              checked={isRequired}
              path={getResourcePath(question)}
              checkedKey="required"
              className="block"
            />
          );
        },
      },
      {
        accessorKey: "prompt",
        header: ({ column, table }) => <DataTableColumnHeader column={column} table={table} />,
        cell: ({ getValue }) => <span className="line-clamp-2">{getValue() as string}</span>,
      },
      {
        accessorKey: "valueType",
        id: "answer type",
        header: ({ column, table }) => <DataTableColumnHeader column={column} table={table} />,
        cell: ({ getValue, row }) => {
          const valueType = getValue() as string;
          const tone = row.original.tone;
          const isNegativeTone = tone === ASSET_QUESTION_TONES.NEGATIVE;
          const isPositiveTone = tone === ASSET_QUESTION_TONES.POSITIVE;

          return valueType === "BINARY" || valueType === "INDETERMINATE_BINARY" ? (
            <span className="flex items-center gap-1 text-xs">
              <span
                className={cn("inline-flex items-end gap-0.5", {
                  "text-primary": isPositiveTone,
                  "text-destructive": isNegativeTone,
                })}
              >
                {isPositiveTone && <Check className="inline-block size-3.5" />}
                {isNegativeTone && <X className="inline-block size-3.5" />}
                Yes
              </span>
              <span className="text-muted-foreground">/</span>
              <span
                className={cn("inline-flex items-end gap-0.5", {
                  "text-primary": isNegativeTone,
                  "text-destructive": isPositiveTone,
                })}
              >
                {isNegativeTone && <Check className="inline-block size-3.5" />}
                {isPositiveTone && <X className="inline-block size-3.5" />}
                No
              </span>
              {valueType === "INDETERMINATE_BINARY" && (
                <>
                  <span className="text-muted-foreground">/</span>
                  <span className="text-muted-foreground shrink-0">N/A</span>
                </>
              )}
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs">
              {valueType === "DATE" ? (
                <Calendar className="inline-block size-3.5" />
              ) : valueType === "TEXT" ? (
                <TextCursorInput className="inline-block size-3.5" />
              ) : valueType === "TEXTAREA" ? (
                <Text className="inline-block size-3.5" />
              ) : valueType === "NUMBER" ? (
                <Hash className="inline-block size-3.5" />
              ) : valueType === "IMAGE" ? (
                <Image className="inline-block size-3.5" />
              ) : null}
              <span className="capitalize">{valueType.replace("_", " ").toLowerCase()}</span>
            </span>
          );
        },
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
                <DropdownMenuItem onSelect={() => editQuestion.openData(question)}>
                  <Pencil />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => {
                    const payload = {
                      active: false,
                      order: question.order ?? undefined,
                      type: question.type,
                      required: question.required,
                      prompt: question.prompt,
                      valueType: question.valueType,
                      tone: question.tone ?? undefined,
                      assetAlertCriteria: question.assetAlertCriteria
                        ? {
                            createMany: {
                              data: question.assetAlertCriteria.map((c) => ({
                                rule: c.rule,
                                alertLevel: c.alertLevel,
                                autoResolve: c.autoResolve,
                              })),
                            },
                          }
                        : undefined,
                      consumableConfig: question.consumableConfig
                        ? {
                            create: {
                              consumableProduct: {
                                connect: {
                                  id: question.consumableConfig.consumableProductId,
                                },
                              },
                              mappingType: question.consumableConfig.mappingType,
                            },
                          }
                        : undefined,
                    } satisfies z.infer<typeof createAssetQuestionSchema>;

                    submitDuplicateQuestion(payload as any, {
                      method: "post",
                      path: getResourcePath(),
                    });
                  }}
                >
                  <Copy />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() =>
                    setDeleteAction((draft) => {
                      draft.open = true;
                      draft.title = "Delete Question";
                      draft.message = `Are you sure you want to delete the question "${question.prompt}"?`;
                      draft.onConfirm = () => {
                        const resourceName =
                          parentType === "product" ? "products" : "product-categories";
                        submitDelete(
                          {},
                          {
                            method: "delete",
                            path: `/api/proxy/${resourceName}/${parentId}/questions/${question.id}`,
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
    [parentType, parentId, readOnly, submitDelete, getResourcePath]
  );

  return (
    <>
      <DataTable
        data={questions.slice().sort((a, b) => {
          if (a.type !== b.type) {
            return a.type === "SETUP" ? -1 : 1;
          }
          if (a.order !== b.order) {
            return (a.order ?? 0) - (b.order ?? 0);
          }

          return isAfter(a.createdOn, b.createdOn) ? 1 : -1;
        })}
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
                  existingInspectionQuestionsCount={existingInspectionQuestionsCount}
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
