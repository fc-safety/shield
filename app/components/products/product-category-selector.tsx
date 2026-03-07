import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Pencil, Plus, Search, Settings, Trash } from "lucide-react";
import { useMemo, useState } from "react";
import { useAccessIntent } from "~/contexts/requested-access-context";
import { useAuthenticatedFetch } from "~/hooks/use-authenticated-fetch";
import { useBlurOnClose } from "~/hooks/use-blur-on-close";
import useConfirmAction from "~/hooks/use-confirm-action";
import type { ProductCategory } from "~/lib/models";
import {
  PRODUCT_CATEGORIES_QUERY_KEY_PREFIX,
  getProductCategoriesForSelectorQueryOptions,
} from "~/lib/services/product-categories.service";
import { cn } from "~/lib/utils";
import ConfirmationDialog from "../confirmation-dialog";
import Icon from "../icons/icon";
import {
  ResponsiveModal,
  ResponsiveModalBody,
  ResponsiveModalContent,
  ResponsiveModalFooter,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalTrigger,
} from "../responsive-modal";
import { Badge } from "../ui/badge";
import CustomTag from "./custom-tag";
import EditProductCategoryButton from "./edit-product-category-button";

interface ProductCategorySelectorProps {
  value?: string;
  onValueChange?: (value: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  className?: string;
  clientId?: string;
}

export default function ProductCategorySelector({
  value,
  onValueChange,
  onBlur,
  disabled,
  className,
  clientId,
}: ProductCategorySelectorProps) {
  const accessIntent = useAccessIntent();
  const { fetchOrThrow } = useAuthenticatedFetch();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [tempValue, setTempValue] = useState(value);
  const [managing, setManaging] = useState(false);
  const [editCategory, setEditCategory] = useState<ProductCategory | null>(null);

  const queryOptions = getProductCategoriesForSelectorQueryOptions(fetchOrThrow, {
    clientId,
    accessIntent,
  });

  const { data: categories = [], isLoading } = useQuery({
    ...queryOptions,
    enabled: open || !!value,
  });

  const invalidateCategories = () => {
    queryClient.invalidateQueries({
      predicate: ({ queryKey }) => queryKey[0] === PRODUCT_CATEGORIES_QUERY_KEY_PREFIX,
    });
  };

  const deleteMutation = useMutation({
    mutationFn: (categoryId: string) =>
      fetchOrThrow(`/product-categories/${categoryId}`, { method: "DELETE" }),
    onSuccess: invalidateCategories,
  });

  const [deleteAction, setDeleteAction] = useConfirmAction({
    variant: "destructive",
  });

  const defaultCategory = useMemo(
    () => categories.find((c) => c.id === value),
    [categories, value]
  );

  useBlurOnClose({
    onBlur,
    open,
  });

  const canManage = (category: ProductCategory) => {
    if (accessIntent === "system") return true;
    return !!category.clientId && category.clientId === clientId;
  };

  const hasManageableItems = useMemo(
    () => categories.some(canManage),
    [categories, accessIntent, clientId]
  );

  return (
    <ResponsiveModal open={open} onOpenChange={setOpen}>
      {value ? (
        <ProductCategoryCard
          productCategory={defaultCategory}
          renderEditButton={() => (
            <ResponsiveModalTrigger>
              <Button type="button" variant="ghost" size="icon" disabled={disabled}>
                <Pencil />
              </Button>
            </ResponsiveModalTrigger>
          )}
        />
      ) : (
        <ResponsiveModalTrigger>
          <Button type="button" size="sm" disabled={disabled} className={cn(className)}>
            <Search />
            Select Category
          </Button>
        </ResponsiveModalTrigger>
      )}
      <ResponsiveModalContent classNames={{ dialog: "sm:max-w-2xl" }}>
        <ResponsiveModalHeader>
          <ResponsiveModalTitle>Find Category</ResponsiveModalTitle>
        </ResponsiveModalHeader>
        <ResponsiveModalBody>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="animate-spin" />
            </div>
          ) : (
            <RadioGroup
              defaultValue="card"
              className="grid grid-cols-2 gap-4 py-2"
              onValueChange={managing ? undefined : setTempValue}
              value={tempValue ?? ""}
            >
              <EditProductCategoryButton
                onSubmitted={invalidateCategories}
                trigger={
                  <Button
                    type="button"
                    variant="outline"
                    className="bg-primary/5 border-primary text-primary hover:bg-primary/10 hover:text-primary flex h-full min-h-[88px] w-full flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed p-4"
                  >
                    <Plus className="size-5" />
                    <span className="text-xs">New Category</span>
                  </Button>
                }
              />
              {categories
                .filter((c) => c.active || c.id === value)
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((productCategory) => (
                  <div key={productCategory.id} className="relative">
                    <RadioGroupItem
                      value={productCategory.id}
                      id={productCategory.id}
                      className="peer sr-only"
                      disabled={!productCategory.active || managing}
                    />
                    <Label
                      htmlFor={productCategory.id}
                      className={cn(
                        "border-muted bg-popover hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary flex h-full flex-col items-center justify-center gap-2 rounded-md border-2 p-4 font-semibold",
                        managing && "pointer-events-none"
                      )}
                    >
                      {productCategory.clientId && <CustomTag />}
                      <div className="flex items-center gap-2">
                        {productCategory.icon && (
                          <Icon
                            iconId={productCategory.icon}
                            color={productCategory.color}
                            className="text-lg"
                          />
                        )}
                        {productCategory.shortName && (
                          <span className="uppercase">{productCategory.shortName}</span>
                        )}
                      </div>
                      <span className="font-regular text-center text-xs">
                        {productCategory.name}
                      </span>
                    </Label>
                    {managing && canManage(productCategory) && (
                      <div className="absolute inset-0 flex items-center justify-center gap-2 rounded-md bg-black/50">
                        <Button
                          type="button"
                          size="icon"
                          variant="secondary"
                          onClick={() => setEditCategory(productCategory)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="destructive"
                          onClick={() => {
                            setDeleteAction((draft) => {
                              draft.open = true;
                              draft.title = "Delete Category";
                              draft.message = `Are you sure you want to delete ${productCategory.name}?`;
                              draft.requiredUserInput = productCategory.name;
                              draft.onConfirm = () => {
                                deleteMutation.mutate(productCategory.id);
                              };
                            });
                          }}
                        >
                          <Trash className="size-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
            </RadioGroup>
          )}
        </ResponsiveModalBody>
        <ResponsiveModalFooter className="flex w-full items-center justify-between gap-2">
          <Button
            type="button"
            variant={managing ? "default" : "outline"}
            onClick={() => setManaging((m) => !m)}
            disabled={!hasManageableItems && !managing}
            title={!hasManageableItems ? "No custom categories to manage" : undefined}
          >
            <Settings className="size-4" />
            {managing ? "Done" : "Manage"}
          </Button>
          <div className="flex gap-2">
            <Button variant="secondary" type="button" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (tempValue) {
                  onValueChange?.(tempValue);
                }
                setOpen(false);
              }}
              disabled={tempValue === undefined || managing}
            >
              Select
            </Button>
          </div>
        </ResponsiveModalFooter>
      </ResponsiveModalContent>
      <EditProductCategoryButton
        productCategory={editCategory ?? undefined}
        open={!!editCategory}
        onOpenChange={(open) => {
          if (!open) setEditCategory(null);
        }}
        onSubmitted={invalidateCategories}
        trigger={null}
      />
      <ConfirmationDialog {...deleteAction} />
    </ResponsiveModal>
  );
}

interface ProductCategoryCardProps {
  productCategory: ProductCategory | undefined;
  renderEditButton?: () => React.ReactNode;
  className?: string;
}

export function ProductCategoryCard({
  productCategory,
  renderEditButton,
  className,
}: ProductCategoryCardProps) {
  return (
    <Card className={className}>
      {productCategory ? (
        <>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="grid gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  {productCategory.icon && (
                    <Icon
                      iconId={productCategory.icon}
                      color={productCategory.color}
                      className="text-lg"
                    />
                  )}
                  <span className="min-w-min flex-1">{productCategory?.name}</span>
                  {productCategory.shortName && (
                    <Badge className={cn("w-max text-sm uppercase")} variant="secondary">
                      {productCategory.shortName}
                    </Badge>
                  )}
                  {productCategory.clientId && <CustomTag />}
                </div>
                <span className="text-muted-foreground text-xs">
                  {productCategory?.description || <>&mdash;</>}
                </span>
              </div>
              {renderEditButton?.()}
            </CardTitle>
          </CardHeader>
        </>
      ) : (
        <CardHeader>
          <CardTitle>
            <Loader2 className="animate-spin" />
          </CardTitle>
        </CardHeader>
      )}
    </Card>
  );
}
