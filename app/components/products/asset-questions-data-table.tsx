import { DataTable, type DataTableProps } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { isAfter } from "date-fns";
import { Copy, MoreHorizontal, Pencil, Trash } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type z from "zod";
import type { ViewContext } from "~/.server/api-utils";
import ConditionPill from "~/components/assets/condition-pill";
import { useAuth } from "~/contexts/auth-context";
import { useAuthenticatedFetch } from "~/hooks/use-authenticated-fetch";
import { useConditionLabels } from "~/hooks/use-condition-labels";
import useConfirmAction from "~/hooks/use-confirm-action";
import { useModalFetcher } from "~/hooks/use-modal-fetcher";
import { useOpenData } from "~/hooks/use-open-data";
import type { AssetQuestion, AssetQuestionResponseType } from "~/lib/models";
import { AssetQuestionTypes } from "~/lib/models";
import type { createAssetQuestionSchema } from "~/lib/schema";
import { getProductCategoriesQueryOptions } from "~/lib/services/product-categories.service";
import { isGlobalAdmin } from "~/lib/users";
import ActiveIndicator2 from "../active-indicator-2";
import ActiveToggle from "../active-toggle";
import EditAssetQuestionButton from "../assets/asset-question-details-form/edit-asset-question-button";
import ConfirmationDialog from "../confirmation-dialog";
import SubmittingCheckbox from "../submitting-checkbox";
import SubmittingSelect from "../submitting-select";
import SubmittingTextarea from "../submitting-textarea";
import QuestionResponseTypeDisplay from "./question-response-type-display";

interface AssetQuestionsDataTableProps
  extends Pick<
    DataTableProps<AssetQuestion, any>,
    | "initialState"
    | "onSortingChange"
    | "onColumnFiltersChange"
    | "onColumnVisibilityChange"
    | "onColumnOrderChange"
    | "onPaginationChange"
  > {
  questions: AssetQuestion[];
  readOnly?: boolean;
  viewContext?: ViewContext;
}

export default function AssetQuestionsDataTable({
  questions,
  readOnly = false,
  viewContext,
  initialState = {},
  onSortingChange,
  onColumnFiltersChange,
  onColumnVisibilityChange,
  onColumnOrderChange,
  onPaginationChange,
}: AssetQuestionsDataTableProps) {
  const editQuestion = useOpenData<AssetQuestion>();
  const { labels, prefetchLabels, isLoading, getLabel } = useConditionLabels();
  const { fetchOrThrow } = useAuthenticatedFetch();

  const { user } = useAuth();
  const userIsGlobalAdmin = isGlobalAdmin(user);

  const { submitJson: submitDelete } = useModalFetcher();
  const { submitJson: submitDuplicateQuestion } = useModalFetcher();

  const [deleteAction, setDeleteAction] = useConfirmAction();
  const [editingPromptId, setEditingPromptId] = useState<string | null>(null);

  const getIsOwnerOrGlobalAdmin = useCallback(
    (question: AssetQuestion) => {
      return userIsGlobalAdmin || question.client?.externalId === user.clientId;
    },
    [user]
  );

  // Prefetch all labels when questions change
  useEffect(() => {
    const conditions = questions.flatMap((q) =>
      (q.conditions || []).map((c) => ({
        conditionType: c.conditionType,
        value: c.value,
      }))
    );
    prefetchLabels(conditions);
  }, [questions, prefetchLabels]);

  const sortedQuestions = useMemo(() => {
    return questions.slice().sort((a, b) => {
      if (a.type !== b.type) {
        return numerizeType(a.type) - numerizeType(b.type);
      }
      if (a.order !== b.order) {
        return (a.order ?? 0) - (b.order ?? 0);
      }
      return isAfter(a.createdOn, b.createdOn) ? 1 : -1;
    });
  }, [questions]);

  const { data: categories, isLoading: categoriesLoading } = useQuery(
    getProductCategoriesQueryOptions(fetchOrThrow)
  );

  // Prepare category filter options
  const categoryFilterOptions = useMemo(() => {
    return (categories ?? [])
      .map((category) => ({
        label: `${category.shortName ? `${category.shortName} - ` : ""}${category.name}`,
        id: category.id,
        isGlobal: category.clientId === null,
      }))
      .sort((a, b) => {
        // Sort global categories (no clientId) first
        if (a.isGlobal && !b.isGlobal) return -1;
        if (!a.isGlobal && b.isGlobal) return 1;

        // Within each group, sort alphabetically by name
        return a.label.localeCompare(b.label);
      })
      .map(({ label, id }) => ({
        label,
        value: `{category}:${id}`,
      }));
  }, [categories]);

  const columns = useMemo(
    (): ColumnDef<AssetQuestion>[] => [
      {
        accessorKey: "active",
        header: ({ column, table }) => <DataTableColumnHeader column={column} table={table} />,
        filterFn: "defaultIncludes" as any,
        cell: ({ getValue, row }) => {
          const question = row.original;
          const isActive = getValue() as boolean;
          return readOnly || !getIsOwnerOrGlobalAdmin(question) ? (
            <ActiveIndicator2 active={isActive} />
          ) : (
            <ActiveToggle
              active={isActive}
              path={getResourcePath(question)}
              viewContext={viewContext}
            />
          );
        },
      },
      {
        accessorKey: "type",
        header: ({ column, table }) => <DataTableColumnHeader column={column} table={table} />,
        cell: ({ getValue, row }) => {
          const question = row.original;
          const currentType = getValue() as string;
          const typeOptions = AssetQuestionTypes.map((type) => ({
            value: type,
            label: type
              .replace(/_/g, " ")
              .toLowerCase()
              .replace(/\b\w/g, (l) => l.toUpperCase()),
          }));

          return readOnly || !getIsOwnerOrGlobalAdmin(question) ? (
            <span className="capitalize">{currentType.replace(/_/g, " ").toLowerCase()}</span>
          ) : (
            <SubmittingSelect
              value={currentType}
              path={getResourcePath(question)}
              valueKey="type"
              options={typeOptions}
              className="w-[160px]"
              viewContext={viewContext}
            />
          );
        },
      },
      {
        accessorKey: "required",
        header: ({ column, table }) => <DataTableColumnHeader column={column} table={table} />,
        cell: ({ getValue, row }) => {
          const question = row.original;
          const isRequired = getValue() as boolean;
          return readOnly || !getIsOwnerOrGlobalAdmin(question) ? (
            <span className="text-muted-foreground text-xs">{isRequired ? "Yes" : "No"}</span>
          ) : (
            <SubmittingCheckbox
              checked={isRequired}
              path={getResourcePath(question)}
              checkedKey="required"
              className="block"
              viewContext={viewContext}
            />
          );
        },
      },
      {
        accessorKey: "prompt",
        header: ({ column, table }) => <DataTableColumnHeader column={column} table={table} />,
        cell: ({ getValue, row }) => {
          const question = row.original;
          const prompt = getValue() as string;

          return readOnly || !getIsOwnerOrGlobalAdmin(question) ? (
            <span className="line-clamp-2">{prompt}</span>
          ) : (
            <SubmittingTextarea
              value={prompt}
              path={getResourcePath(question)}
              valueKey="prompt"
              isEditing={editingPromptId === question.id}
              onEditingChange={(editing) => setEditingPromptId(editing ? question.id : null)}
              className="w-full"
              viewContext={viewContext}
            />
          );
        },
      },
      {
        accessorKey: "valueType",
        id: "answer type",
        header: ({ column, table }) => <DataTableColumnHeader column={column} table={table} />,
        cell: ({ getValue, row }) => {
          const valueType = getValue() as AssetQuestionResponseType;
          const tone = row.original.tone;
          return <QuestionResponseTypeDisplay valueType={valueType} tone={tone} />;
        },
      },
      {
        accessorKey: "conditions",
        header: ({ column, table }) => <DataTableColumnHeader column={column} table={table} />,
        filterFn: (row, _columnId, filterValue) => {
          const conditions = row.original.conditions || [];
          const filterValuesWithKey = (filterValue as string[]).map((valueAndKey) => {
            const colonIdx = valueAndKey.indexOf(":");
            return {
              key: valueAndKey.slice(1, colonIdx - 1),
              value: valueAndKey.slice(colonIdx + 1),
            };
          });

          if (!filterValuesWithKey || filterValuesWithKey.length === 0) {
            return true;
          }

          // Check if any condition has PRODUCT_CATEGORY type with a value matching selected categories
          return conditions.some((condition) =>
            condition.value.some((value) =>
              filterValuesWithKey.some(({ key, value: filterValue }) => {
                const matchesTypeKey =
                  (condition.conditionType === "PRODUCT_CATEGORY" && key === "category") ||
                  (condition.conditionType === "METADATA" && key === "metadata");
                return matchesTypeKey && value === filterValue;
              })
            )
          );
        },
        sortingFn: (rowA, rowB) => {
          const conditionsA = rowA.original.conditions || [];
          const conditionsB = rowB.original.conditions || [];

          // Get the first condition for comparison (or empty object if none)
          const firstConditionA = conditionsA[0] || { conditionType: "", value: [""] };
          const firstConditionB = conditionsB[0] || { conditionType: "", value: [""] };

          // Sort by condition type first (clean PRODUCT_ prefix for sorting)
          const cleanTypeA = firstConditionA.conditionType.startsWith("PRODUCT_")
            ? firstConditionA.conditionType.replace("PRODUCT_", "")
            : firstConditionA.conditionType;
          const cleanTypeB = firstConditionB.conditionType.startsWith("PRODUCT_")
            ? firstConditionB.conditionType.replace("PRODUCT_", "")
            : firstConditionB.conditionType;
          const typeComparison = cleanTypeA.localeCompare(cleanTypeB);
          if (typeComparison !== 0) {
            return typeComparison;
          }

          // Then sort by first value label alphabetically
          const labelA =
            labels[`${firstConditionA.conditionType}:${firstConditionA.value[0]}`] ||
            firstConditionA.value[0] ||
            "";
          const labelB =
            labels[`${firstConditionB.conditionType}:${firstConditionB.value[0]}`] ||
            firstConditionB.value[0] ||
            "";

          return labelA.localeCompare(labelB);
        },
        cell: ({ row }) => {
          const conditions = row.original.conditions;
          if (!conditions || conditions.length === 0) {
            return <span className="text-muted-foreground text-xs">None</span>;
          }
          return (
            <div className="flex flex-wrap gap-1">
              {conditions.flatMap((condition) =>
                condition.value.map((value, valueIndex) => {
                  const label = getLabel(condition.conditionType, value, "–");
                  const isValueLoading = isLoading(condition.conditionType, value);

                  return (
                    <ConditionPill
                      key={`${condition.id}-${valueIndex}`}
                      condition={{ ...condition, value: [value] }}
                      label={label}
                      isLoading={isValueLoading}
                    />
                  );
                })
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "_count.assetAlertCriteria",
        id: "alert triggers",
        header: ({ column, table }) => <DataTableColumnHeader column={column} table={table} />,
        cell: ({ getValue }) => {
          const count = getValue() as number;
          return count > 0 ? (
            <span className="text-xs text-orange-600 dark:text-orange-400">
              {count} trigger{count === 1 ? "" : "s"}
            </span>
          ) : (
            <span className="text-muted-foreground text-xs">None</span>
          );
        },
      },
      {
        accessorKey: "_count.files",
        id: "files",
        header: ({ column, table }) => <DataTableColumnHeader column={column} table={table} />,
        cell: ({ getValue }) => {
          const count = getValue() as number;
          return count > 0 ? (
            <span className="text-xs text-blue-600 dark:text-blue-400">
              {count} file{count === 1 ? "" : "s"}
            </span>
          ) : (
            <span className="text-muted-foreground text-xs">None</span>
          );
        },
      },
      {
        id: "actions",
        cell: ({ row }) => {
          const question = row.original;
          const canManage = !readOnly && getIsOwnerOrGlobalAdmin(question);

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  disabled={!canManage}
                  onSelect={() => editQuestion.openData(question)}
                >
                  <Pencil />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={!canManage}
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
                      conditions: question.conditions
                        ? {
                            createMany: {
                              data: question.conditions.map((c) => ({
                                conditionType: c.conditionType,
                                value: c.value,
                                description: c.description ?? undefined,
                              })),
                            },
                          }
                        : undefined,
                      variants: question.variants
                        ? {
                            createMany: {
                              data: question.variants.map((v) => ({
                                conditions: v.conditions
                                  ? {
                                      createMany: {
                                        data: v.conditions.map((c) => ({
                                          conditionType: c.conditionType,
                                          value: c.value,
                                          description: c.description ?? undefined,
                                        })),
                                      },
                                    }
                                  : undefined,
                                prompt: v.prompt,
                                order: v.order ?? undefined,
                                valueType: v.valueType,
                                tone: v.tone ?? undefined,
                                active: v.active,
                                type: v.type,
                                required: v.required,
                              })),
                            },
                          }
                        : undefined,
                    } satisfies z.infer<typeof createAssetQuestionSchema>;

                    submitDuplicateQuestion(payload as any, {
                      method: "post",
                      path: getResourcePath(),
                      viewContext,
                    });
                  }}
                >
                  <Copy />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  disabled={!canManage}
                  onSelect={() =>
                    setDeleteAction((draft) => {
                      draft.open = true;
                      draft.title = "Delete Question";
                      draft.message = `Are you sure you want to delete the question "${question.prompt}"?`;
                      draft.onConfirm = () => {
                        submitDelete(
                          {},
                          {
                            method: "delete",
                            path: getResourcePath(question),
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
    [
      readOnly,
      submitDelete,
      editQuestion.openData,
      submitDuplicateQuestion,
      labels,
      isLoading,
      categoryFilterOptions,
      editingPromptId,
      setEditingPromptId,
      getIsOwnerOrGlobalAdmin,
    ]
  );

  return (
    <>
      <DataTable
        data={sortedQuestions}
        columns={columns}
        searchPlaceholder="Search questions..."
        initialState={{
          ...initialState,
          columnVisibility: {
            actions: !readOnly,
            ...initialState.columnVisibility,
          },
        }}
        onSortingChange={onSortingChange}
        onColumnFiltersChange={onColumnFiltersChange}
        onColumnVisibilityChange={onColumnVisibilityChange}
        onColumnOrderChange={onColumnOrderChange}
        onPaginationChange={onPaginationChange}
        getRowId={(row) => row.id}
        actions={readOnly ? [] : [<EditAssetQuestionButton key="add" viewContext={viewContext} />]}
        filters={({ table }) => [
          {
            column: table.getColumn("active"),
            title: "Status",
            options: [
              { value: true, label: "Active" },
              { value: false, label: "Inactive" },
            ],
          },
          {
            column: table.getColumn("conditions"),
            title: "Category",
            options: categoryFilterOptions,
            multiple: true,
            loading: categoriesLoading ?? false,
            key: "category",
          },
          {
            column: table.getColumn("type"),
            title: "Type",
            options: [
              {
                value: "SETUP",
                label: "Setup",
              },
              {
                value: "SETUP_AND_INSPECTION",
                label: "Setup and Inspection",
              },
              {
                value: "INSPECTION",
                label: "Inspection",
              },
            ],
          },
          {
            column: table.getColumn("conditions"),
            title: "Metadata",
            options: sortedQuestions
              .flatMap(
                (q) =>
                  q.conditions
                    ?.filter((c) => c.conditionType === "METADATA")
                    .flatMap((c) => c.value) ?? []
              )
              .map((value) => ({
                value: `{metadata}:${value}`,
                label: value.split(":").join(" = "),
              })),
            multiple: true,
            key: "metadata",
          },
        ]}
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
      <EditAssetQuestionButton
        assetQuestion={editQuestion.data ?? undefined}
        trigger={null}
        open={editQuestion.open}
        onOpenChange={editQuestion.setOpen}
        viewContext={viewContext}
      />
    </>
  );
}

const getResourcePath = (question?: AssetQuestion) => {
  return `/api/proxy/asset-questions/${question?.id ?? ""}`;
};

const numerizeType = (type: AssetQuestion["type"]) => {
  return type === "SETUP" ? 0 : type === "SETUP_AND_INSPECTION" ? 1 : 2;
};
