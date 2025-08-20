import { zodResolver } from "@hookform/resolvers/zod";
import { format, formatDistanceToNow } from "date-fns";
import {
  CheckCircle,
  CirclePlus,
  ImageOff,
  ListOrdered,
  ListPlus,
  Minus,
  NotepadText,
  Plus,
  Trash,
} from "lucide-react";
import { useEffect, useMemo, useState, type ComponentProps } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { useFetcher } from "react-router";
import type { z } from "zod";
import type { DataOrError } from "~/.server/api-utils";
import { Button } from "~/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormMessage } from "~/components/ui/form";
import { useModalFetcher } from "~/hooks/use-modal-fetcher";
import { useOpenData } from "~/hooks/use-open-data";
import { useProxyImage } from "~/hooks/use-proxy-image";
import type {
  AnsiCategory,
  Product,
  ProductRequest,
  ProductRequestApproval,
  ProductRequestItem,
  ResultsPage,
} from "~/lib/models";
import { createProductRequestSchema } from "~/lib/schema";
import { buildPath } from "~/lib/urls";
import { cn, dateSort, dedupById } from "~/lib/utils";
import Icon from "../icons/icon";
import { AnsiCategoryDisplay } from "../products/ansi-category-combobox";
import { ResponsiveDialog } from "../responsive-dialog";
import { Card, CardContent, CardDescription, CardHeader } from "../ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Input } from "../ui/input";
import { ScrollArea } from "../ui/scroll-area";
import { Skeleton } from "../ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "../ui/toggle-group";
import ProductRequestApprovalIndicator from "./product-request-approval-indicator";

interface ProductRequestsProps {
  productRequests: ProductRequest[];
}

export default function ProductRequests({ productRequests }: ProductRequestsProps) {
  return (
    <div className="grid gap-4">
      {productRequests.length === 0 && (
        <p className="text-muted-foreground text-xs">No active supply requests.</p>
      )}

      {productRequests
        .slice()
        .sort(dateSort("createdOn"))
        .map((request) => (
          <ProductRequestCard key={request.id} request={request} />
        ))}
    </div>
  );
}

export function NewSupplyRequestButton({ ...props }: ComponentProps<typeof ProductRequestForm>) {
  const [open, setOpen] = useState(false);

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={setOpen}
      trigger={
        <Button type="submit" variant="default" size="sm" className="justify-self-end">
          <NotepadText />
          New Supply Request
        </Button>
      }
      title="Supply Request"
      description="Please select which supplies and the quantities you would like to order."
      dialogClassName="sm:max-w-xl"
      disableDisplayTable
      render={({ isDesktop }) => (
        <ProductRequestForm
          {...props}
          renderSubmitButton={({ isSubmitting, disabled }) => {
            const btn = (
              <Button type="submit" disabled={disabled || isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit Request"}
              </Button>
            );

            return isDesktop ? <DialogFooter>{btn}</DialogFooter> : btn;
          }}
          onSubmitted={() => {
            setOpen(false);
          }}
        />
      )}
    />
  );
}

type TForm = z.infer<typeof createProductRequestSchema>;
const resolver = zodResolver(createProductRequestSchema);

function ProductRequestForm({
  assetId,
  parentProductId,
  productCategoryId,
  renderSubmitButton = ({ isSubmitting, disabled }) => (
    <Button type="submit" disabled={disabled || isSubmitting}>
      {isSubmitting ? "Submitting..." : "Submit"}
    </Button>
  ),
  onSubmitted = () => {},
  onSuccess = () => {},
}: {
  assetId: string;
  parentProductId: string;
  productCategoryId: string;
  renderSubmitButton?: (options: { isSubmitting: boolean; disabled: boolean }) => React.ReactNode;
  onSubmitted?: () => void;
  onSuccess?: (data: ProductRequest) => void;
}) {
  const previewImage = useOpenData<string>();

  const fetcher = useFetcher<ResultsPage<Product>>();
  const suppliesLoading =
    fetcher.state === "loading" || (fetcher.state === "idle" && !fetcher.data);

  const [supplies, setSupplies] = useState<Product[] | null>(null);
  const supplyMap = useMemo(() => {
    return new Map((supplies ?? []).map((product) => [product.id, product]));
  }, [supplies]);

  const [orderItemsIsOverflowingY, setOrderItemsIsOverflowingY] = useState(false);
  const [orderItemsIsScrollMaxedY, setOrderItemsIsScrollMaxedY] = useState(false);

  useEffect(() => {
    if (fetcher.state === "idle" && !fetcher.data) {
      fetcher.load(
        buildPath(
          "/api/proxy/products/",
          // OR: [
          {
            parentProduct: {
              id: parentProductId,
            },
            limit: 1000,
          }
          // {
          //   manufacturer: {
          //     name: GENERIC_MANUFACTURER_NAME,
          //     parentProductId: "_NULL",
          //   },
          //   productCategory: {
          //     id: productCategoryId,
          //   },
          // },
          // ],
        )
      );
    }
  }, [fetcher.state, fetcher.data, parentProductId, productCategoryId]);

  useEffect(() => {
    if (fetcher.data) {
      setSupplies(fetcher.data.results);
    }
  }, [fetcher.data]);

  const form = useForm({
    resolver,
    defaultValues: {
      productRequestItems: {
        createMany: {
          data: [],
        },
      },
      asset: {
        connect: {
          id: assetId,
        },
      },
    },
    mode: "onBlur",
  });

  const {
    formState: { isDirty, isValid },
  } = form;

  const {
    fields: productRequestItems,
    append,
    remove,
  } = useFieldArray({
    control: form.control,
    name: "productRequestItems.createMany.data",
  });

  const ansiCategories = useMemo(() => {
    if (!supplies) return null;

    const categories: Pick<AnsiCategory, "id" | "name" | "color" | "icon">[] = dedupById(
      supplies.map((p) => p.ansiCategory).filter((c): c is NonNullable<typeof c> => !!c)
    );

    if (supplies.some((p) => !p.ansiCategory)) {
      categories.push({
        id: "other",
        name: "Other",
        color: null,
        icon: "ellipsis",
      });
    }

    return categories;
  }, [supplies]);

  const { proxyImageUrls: optimizedImageUrls } = useProxyImage(
    (supplies ?? [])
      .filter((p): p is typeof p & { imageUrl: string } => !!p.imageUrl)
      .map((p) => ({
        src: p.imageUrl,
        pre: "square",
        size: "96",
      }))
  );

  const optimizedImageUrlsMap = useMemo(() => {
    return new Map(optimizedImageUrls?.map((p) => [p.sourceUrl, p.imageUrl]) ?? []);
  }, [optimizedImageUrls]);

  const { createOrUpdateJson: submit, isSubmitting } = useModalFetcher<DataOrError<ProductRequest>>(
    {
      onSubmitted,
      onData: (data) => {
        if (data.data) {
          onSuccess(data.data);
        }
      },
    }
  );

  const handleSubmit = (data: TForm) => {
    // Remove undefined values to make it JSON-serializable
    const cleanedData = JSON.parse(JSON.stringify(data));
    submit(cleanedData, {
      path: `/api/proxy/product-requests`,
      id: undefined,
    });
  };

  return (
    <>
      <Form {...form}>
        <form className="mt-4 w-full space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
          <div className="w-full">
            <h3 className="flex items-center gap-x-2 text-base font-medium">
              <ListPlus className="size-5" />
              Available Supplies
            </h3>
            <ConsumableSelectTabs
              ansiCategories={ansiCategories}
              supplies={supplies}
              suppliesLoading={suppliesLoading}
              productRequestItems={productRequestItems}
              optimizedImageUrlsMap={optimizedImageUrlsMap}
              append={append}
              onPreviewImage={previewImage.openData}
            />
            {ansiCategories && ansiCategories.length === 0 && (
              <p className="text-muted-foreground col-span-full flex h-12 items-center justify-center text-xs">
                No consumables available for this product.
              </p>
            )}
          </div>

          <div>
            <h3 className="mb-2 flex items-center gap-x-2 text-base font-medium">
              <ListOrdered className="size-5" />
              Order Items
            </h3>
            <ScrollArea
              className="border-border relative h-[25dvh] min-h-54 border-t border-b"
              onIsOverflowingY={setOrderItemsIsOverflowingY}
              onIsScrollMaxedY={setOrderItemsIsScrollMaxedY}
            >
              <div className="divide-border/50 mt-2 grid grid-cols-[auto_auto_1fr_auto] gap-x-3 divide-y">
                {productRequestItems.map((item, index) => {
                  const product = supplyMap.get(item.productId)!;
                  return (
                    <FormField
                      key={item.id}
                      name={`productRequestItems.createMany.data.${index}.quantity`}
                      render={({ field: { onChange, ...field } }) => (
                        <FormItem className="col-span-full grid grid-cols-subgrid space-y-0 py-2">
                          <FormControl>
                            <div className="col-span-full grid grid-cols-subgrid items-center">
                              <Button
                                type="button"
                                variant="destructive"
                                size="iconSm"
                                onClick={() => remove(index)}
                              >
                                <Trash />
                              </Button>
                              <div className="flex items-center">
                                <Input
                                  autoFocus={false}
                                  type="text"
                                  {...field}
                                  className="focus-visible:border-border h-8 w-10 rounded-none rounded-l-md border-0 border-t-1 border-b-1 border-l-1 px-1 text-center"
                                  inputMode="numeric"
                                  pattern="[0-9]*"
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    if (value === "") {
                                      onChange("");
                                      return;
                                    }
                                    const maybeInt = parseInt(value);
                                    if (!isNaN(maybeInt)) {
                                      onChange(maybeInt);
                                    }
                                  }}
                                />
                                <ToggleGroup
                                  type="single"
                                  value={"none"}
                                  size="sm"
                                  variant="outline"
                                >
                                  <ToggleGroupItem
                                    value="minus"
                                    className="first:rounded-l-none"
                                    onClick={() => {
                                      onChange(Math.max(field.value - 1, 1));
                                    }}
                                    disabled={field.value === 1}
                                  >
                                    <Minus />
                                  </ToggleGroupItem>
                                  <ToggleGroupItem
                                    value="plus"
                                    onClick={() => {
                                      onChange(field.value + 1);
                                    }}
                                  >
                                    <Plus />
                                  </ToggleGroupItem>
                                </ToggleGroup>
                              </div>
                              <ProductRequestItem
                                product={product}
                                optimizedImageUrl={
                                  product.imageUrl
                                    ? optimizedImageUrlsMap.get(product.imageUrl)
                                    : undefined
                                }
                                onPreviewImage={previewImage.openData}
                                className="col-span-2 grid-cols-subgrid"
                                showAnsiCategory
                              />
                            </div>
                          </FormControl>
                          <FormMessage className="col-span-full" />
                        </FormItem>
                      )}
                    ></FormField>
                  );
                })}
              </div>
              {productRequestItems.length === 0 && (
                <p className="text-muted-foreground flex w-full items-center justify-center p-4 text-xs sm:p-6">
                  No order items.
                </p>
              )}
              <ScrollHint show={orderItemsIsOverflowingY && !orderItemsIsScrollMaxedY} />
            </ScrollArea>
          </div>
          {renderSubmitButton({ isSubmitting, disabled: !isDirty || !isValid })}
        </form>
      </Form>
      <Dialog open={previewImage.open} onOpenChange={previewImage.setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Preview</DialogTitle>
          </DialogHeader>
          <img src={previewImage.data ?? "#"} alt="Preview" className="w-full rounded-lg" />
        </DialogContent>
      </Dialog>
    </>
  );
}

function ConsumableSelectTabs({
  ansiCategories,
  supplies,
  suppliesLoading,
  productRequestItems,
  append,
  onPreviewImage,
  optimizedImageUrlsMap,
}: {
  ansiCategories: Pick<AnsiCategory, "id" | "name" | "color" | "icon">[] | null;
  supplies: Product[] | null;
  suppliesLoading: boolean;
  productRequestItems: TForm["productRequestItems"]["createMany"]["data"];
  append: (item: TForm["productRequestItems"]["createMany"]["data"][number]) => void;
  onPreviewImage: (url: string) => void;
  optimizedImageUrlsMap: Map<string, string>;
}) {
  const selectedSupplyIds = useMemo(() => {
    return new Set(productRequestItems.map((i) => i.productId));
  }, [productRequestItems]);

  const showTabs = ansiCategories && ansiCategories.length > 1;
  const [selectedTab, setSelectedTab] = useState(ansiCategories?.at(0)?.id);
  useEffect(() => {
    if (selectedTab) return;
    setSelectedTab(ansiCategories?.at(0)?.id);
  }, [ansiCategories]);

  return (
    <>
      {!supplies && suppliesLoading && (
        <div className="mt-2">
          <Skeleton className="h-12 w-full" />
        </div>
      )}
      {showTabs && (
        <div className="text-muted-foreground w-full pb-1 text-start text-xs">
          Select a First Aid color to view supplies.
        </div>
      )}
      <Tabs
        value={selectedTab}
        onValueChange={setSelectedTab}
        className={cn("mt-2 hidden max-w-[calc(100vw-2rem)]", {
          block: showTabs,
        })}
      >
        <TabsList className="w-full min-w-fit gap-x-1.5">
          {(ansiCategories ?? []).map((category) => (
            <TabsTrigger
              key={category.id}
              value={category.id}
              style={
                {
                  "--tab-active-bg": category.color ?? "hsl(var(--background))",
                  "--tab-active-color": category.color
                    ? "white" // getContrastTextColor(category.color)
                    : "hsl(var(--foreground))",
                  "--tab-inactive-color": category.color ?? "hsl(var(--muted-foreground))",
                } as React.CSSProperties
              }
              className="flex shrink-0 grow bg-[var(--tab-active-bg)] font-bold text-[var(--tab-active-color)] data-[state=active]:scale-105 data-[state=active]:bg-[var(--tab-active-bg)] data-[state=active]:text-[var(--tab-active-color)]"
            >
              {category.icon ? <Icon iconId={category.icon} /> : category.name}
            </TabsTrigger>
          ))}
        </TabsList>
        {(ansiCategories ?? []).map((category) => (
          <TabsContent key={category.id} value={category.id}>
            <AvailableConsumables
              ansiCategory={category}
              consumables={
                !supplies
                  ? []
                  : showTabs
                    ? supplies.filter(
                        (p) =>
                          p.ansiCategory?.id === category.id ||
                          (!p.ansiCategory && category.id === "other")
                      )
                    : supplies
              }
              selectedConsumableIds={selectedSupplyIds}
              onAdd={(productId) =>
                append({
                  productId: productId,
                  quantity: 1,
                })
              }
              onPreviewImage={onPreviewImage}
              showAnsiCategory={!showTabs}
              optimizedImageUrlsMap={optimizedImageUrlsMap}
            />
          </TabsContent>
        ))}
      </Tabs>
    </>
  );
}

function AvailableConsumables({
  ansiCategory,
  consumables,
  selectedConsumableIds,
  onAdd,
  onPreviewImage,
  showAnsiCategory = false,
  optimizedImageUrlsMap,
}: {
  ansiCategory: Pick<AnsiCategory, "color">;
  consumables: Product[];
  selectedConsumableIds: Set<string>;
  onAdd: (productId: string) => void;
  onPreviewImage: (url: string) => void;
  showAnsiCategory?: boolean;
  optimizedImageUrlsMap: Map<string, string>;
}) {
  const [availableConsumablesIsOverflowingY, setAvailableConsumablesIsOverflowingY] =
    useState(false);
  const [availableConsumablesIsScrollMaxedY, setAvailableConsumablesIsScrollMaxedY] =
    useState(false);

  return (
    <ScrollArea
      style={
        {
          "--ansi-color": ansiCategory.color,
        } as React.CSSProperties
      }
      onIsOverflowingY={setAvailableConsumablesIsOverflowingY}
      onIsScrollMaxedY={setAvailableConsumablesIsScrollMaxedY}
      className={cn("relative h-[25dvh] min-h-54 border-t-2 border-b-2", {
        "border-t-[var(--ansi-color)]": ansiCategory.color,
        "border-b-[var(--ansi-color)]": ansiCategory.color,
      })}
    >
      <div className="divide-border/50 mt-2 grid w-full grid-cols-[auto_1fr_auto] gap-x-3 divide-y">
        {consumables.map((product) => (
          <div
            key={product.id}
            className="col-span-full grid w-full grid-cols-subgrid items-center py-2"
          >
            <Button
              type="button"
              variant="default"
              size="iconSm"
              onClick={() => onAdd(product.id)}
              disabled={selectedConsumableIds.has(product.id)}
            >
              {selectedConsumableIds.has(product.id) ? <CheckCircle /> : <CirclePlus />}
            </Button>
            <ProductRequestItem
              product={product}
              onPreviewImage={onPreviewImage}
              className="col-span-2 grid-cols-subgrid"
              showAnsiCategory={showAnsiCategory}
              optimizedImageUrl={
                product.imageUrl ? optimizedImageUrlsMap.get(product.imageUrl) : undefined
              }
            />
          </div>
        ))}
        {consumables.length === 0 && (
          <p className="text-muted-foreground col-span-full flex h-12 items-center justify-center text-xs">
            No consumables available.
          </p>
        )}
      </div>

      <ScrollHint
        show={availableConsumablesIsOverflowingY && !availableConsumablesIsScrollMaxedY}
      />
    </ScrollArea>
  );
}

function ProductRequestItem({
  product,
  onPreviewImage,
  className,
  showAnsiCategory = false,
  optimizedImageUrl,
}: {
  product: Product;
  onPreviewImage?: (url: string) => void;
  className?: string;
  showAnsiCategory?: boolean;
  optimizedImageUrl?: string;
}) {
  return (
    <div className={cn("grid grid-cols-[1fr_auto] items-center", className)}>
      <div className="text-sm">
        <div>
          {showAnsiCategory && product.ansiCategory && (
            <AnsiCategoryDisplay
              ansiCategory={product.ansiCategory}
              iconOnly
              size="sm"
              className="mr-1 inline-block"
            />
          )}
          {product.name}
        </div>
        {product.description && (
          <div className="text-muted-foreground line-clamp-1 text-xs">{product.description}</div>
        )}
      </div>
      <div className="flex items-center justify-end gap-x-2">
        <button
          type="button"
          disabled={!product.imageUrl}
          onClick={() => product.imageUrl && onPreviewImage?.(product.imageUrl)}
          style={
            {
              "--ansi-color": product.ansiCategory?.color,
            } as React.CSSProperties
          }
          className={cn(
            "border-border flex size-16 items-center justify-center overflow-hidden rounded-md border-2 bg-white p-1",
            {
              "border-[var(--ansi-color)]": product.ansiCategory?.color,
            }
          )}
        >
          {optimizedImageUrl ? (
            <img
              src={optimizedImageUrl ?? "#"}
              alt="Preview"
              className="h-full w-full object-contain"
            />
          ) : (
            <ImageOff className="size-6" />
          )}
        </button>
      </div>
    </div>
  );
}

export function ProductRequestCard({ request }: { request: ProductRequest }) {
  return (
    <Card>
      <CardHeader>
        <CardDescription className="text-muted-foreground flex items-center justify-between gap-x-4 text-xs">
          <div className="flex items-center gap-x-2">
            {/* <Badge variant="default">{request.status}</Badge> */}
            <div className="text-foreground">{formatDistanceToNow(request.createdOn)}</div>
            <div>&mdash;</div>
            <div>{format(request.createdOn, "PPpp")}</div>
          </div>
          {/* <ProductRequestApprovalsDisplay
            approvals={request.productRequestApprovals ?? []}
          /> */}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="divide-border grid grid-cols-[auto_auto_1fr] gap-x-4 divide-y text-sm">
          <div className="text-muted-foreground col-span-full grid grid-cols-subgrid items-center py-2 text-xs font-medium">
            <div>Qty</div>
            <div>Consumable</div>
          </div>
          {request.productRequestItems.map((item) => (
            <div key={item.id} className="col-span-full grid grid-cols-subgrid items-center py-2">
              <div className="text-end">{item.quantity}</div>
              <div>{item.product.name}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function ProductRequestApprovalsDisplay({
  approvals,
}: {
  approvals: ProductRequestApproval[];
}) {
  return (
    <div className="flex items-center gap-x-1">
      {approvals.map((approval) => (
        <ProductRequestApprovalIndicator key={approval.id} approval={approval} />
      ))}
      {approvals.length === 0 && (
        <ProductRequestApprovalIndicator key={"no approval"} approval={null} />
      )}
    </div>
  );
}

const ScrollHint = ({ show }: { show: boolean }) => {
  return (
    <div
      className={cn(
        "text-muted-foreground bg-muted/50 border-border pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 rounded-md border px-2 py-1 text-xs backdrop-blur-md transition-opacity duration-300",
        show ? "opacity-100" : "opacity-0"
      )}
    >
      Scroll &darr;
    </div>
  );
};
