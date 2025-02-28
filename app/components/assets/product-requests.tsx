import { zodResolver } from "@hookform/resolvers/zod";
import { format, formatDistanceToNow } from "date-fns";
import { CirclePlus, Image, NotepadText, Trash } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { useFetcher } from "react-router";
import type { z } from "zod";
import { Button } from "~/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "~/components/ui/form";
import { useModalSubmit } from "~/hooks/use-modal-submit";
import { useOpenData } from "~/hooks/use-open-data";
import { GENERIC_MANUFACTURER_NAME } from "~/lib/constants";
import type {
  AnsiCategory,
  Product,
  ProductRequest,
  ProductRequestApproval,
  ResultsPage,
} from "~/lib/models";
import { createProductRequestSchema } from "~/lib/schema";
import { buildPath } from "~/lib/urls";
import { cn, dedupById } from "~/lib/utils";
import { AnsiCategoryDisplay } from "../products/ansi-category-combobox";
import { ResponsiveDialog } from "../responsive-dialog";
import { Card, CardContent, CardDescription, CardHeader } from "../ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Skeleton } from "../ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import ProductRequestApprovalIndicator from "./product-request-approval-indicator";

interface ProductRequestsProps {
  productRequests: ProductRequest[];
}

export default function ProductRequests({
  productRequests,
}: ProductRequestsProps) {
  return (
    <div className="grid gap-4">
      {productRequests.length === 0 && (
        <p className="text-muted-foreground text-xs">
          No active product requests.
        </p>
      )}

      {productRequests.map((request) => (
        <ProductRequestCard key={request.id} request={request} />
      ))}
    </div>
  );
}

export function NewSupplyRequestButton({
  assetId,
  parentProductId,
}: {
  assetId: string;
  parentProductId: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={setOpen}
      trigger={
        <Button
          type="submit"
          variant="default"
          size="sm"
          className="justify-self-end"
        >
          <NotepadText />
          New Product Request
        </Button>
      }
      title="Product Request"
      description="Please select which consumables and the quantities you would like to order."
      dialogClassName="sm:max-w-xl"
      render={({ isDesktop }) => (
        <ProductRequestForm
          assetId={assetId}
          parentProductId={parentProductId}
          renderSubmitButton={({ isSubmitting, disabled }) => {
            const btn = (
              <Button type="submit" disabled={disabled || isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit Order"}
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
  renderSubmitButton = ({ isSubmitting, disabled }) => (
    <Button type="submit" disabled={disabled || isSubmitting}>
      {isSubmitting ? "Submitting..." : "Submit"}
    </Button>
  ),
  onSubmitted = () => {},
}: {
  assetId: string;
  parentProductId: string;
  renderSubmitButton?: (options: {
    isSubmitting: boolean;
    disabled: boolean;
  }) => React.ReactNode;
  onSubmitted?: () => void;
}) {
  const previewImage = useOpenData<string>();

  const fetcher = useFetcher<ResultsPage<Product>>();
  const subproductsLoading =
    fetcher.state === "loading" || (fetcher.state === "idle" && !fetcher.data);

  const [subproducts, setSubproducts] = useState<Product[]>([]);
  const subproductMap = useMemo(() => {
    return new Map(subproducts.map((product) => [product.id, product]));
  }, [subproducts]);

  useEffect(() => {
    if (fetcher.state === "idle" && !fetcher.data) {
      fetcher.load(
        buildPath("/api/proxy/products/", {
          OR: [
            {
              parentProduct: {
                id: parentProductId,
              },
            },
            {
              manufacturer: {
                name: GENERIC_MANUFACTURER_NAME,
                parentProductId: "_NULL",
              },
            },
          ],
        })
      );
    }
  }, [fetcher, parentProductId]);

  useEffect(() => {
    if (fetcher.data) {
      setSubproducts(fetcher.data.results);
    }
  }, [fetcher.data]);

  const form = useForm<TForm>({
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

  const availableConsumables = useMemo(() => {
    return subproducts.filter(
      (p) => !productRequestItems.some((i) => i.productId === p.id)
    );
  }, [subproducts, productRequestItems]);

  const ansiCategories = useMemo(() => {
    const categories: Pick<AnsiCategory, "id" | "name" | "color">[] = dedupById(
      subproducts
        .map((p) => p.ansiCategory)
        .filter((c): c is NonNullable<typeof c> => !!c)
    );

    if (subproducts.some((p) => !p.ansiCategory)) {
      categories.push({
        id: "other",
        name: "Other",
        color: null,
      });
    }

    return categories;
  }, [subproducts]);

  const showTabs = ansiCategories.length > 1;
  const [selectedTab, setSelectedTab] = useState(ansiCategories.at(0)?.id);
  useEffect(() => {
    if (showTabs) {
      setSelectedTab(ansiCategories.at(0)?.id);
    }
  }, [showTabs, ansiCategories]);

  const { createOrUpdateJson: submit, isSubmitting } = useModalSubmit({
    onSubmitted,
  });

  const handleSubmit = (data: TForm) => {
    submit(data, {
      path: `/api/proxy/product-requests`,
      id: undefined,
    });
  };

  return (
    <>
      <Form {...form}>
        <form
          className="space-y-4 mt-4"
          onSubmit={form.handleSubmit(handleSubmit)}
        >
          <div>
            <h3 className="font-medium text-sm">Available Consumables</h3>
            {subproductsLoading ? (
              <div className="mt-2">
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (
              <Tabs
                value={selectedTab}
                onValueChange={setSelectedTab}
                className="mt-2"
              >
                {showTabs && (
                  <TabsList className="w-full flex">
                    {ansiCategories.map((category) => (
                      <TabsTrigger
                        key={category.id}
                        value={category.id}
                        style={
                          {
                            "--tab-active-bg":
                              category.color ?? "hsl(var(--background))",
                            "--tab-active-color": category.color
                              ? getContrastTextColor(category.color)
                              : "hsl(var(--foreground))",
                          } as React.CSSProperties
                        }
                        className="data-[state=active]:bg-[var(--tab-active-bg)] data-[state=active]:text-[var(--tab-active-color)] grow"
                      >
                        {category.name}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                )}
                {ansiCategories.map((category) => (
                  <TabsContent key={category.id} value={category.id}>
                    <AvailableConsumables
                      consumables={
                        showTabs
                          ? availableConsumables.filter(
                              (p) =>
                                p.ansiCategory?.id === category.id ||
                                (!p.ansiCategory && category.id === "other")
                            )
                          : availableConsumables
                      }
                      onAdd={(productId) =>
                        append({
                          productId: productId,
                          quantity: 1,
                        })
                      }
                      onPreviewImage={previewImage.openData}
                      showAnsiCategory={!showTabs}
                    />
                  </TabsContent>
                ))}
              </Tabs>
            )}
          </div>

          <div>
            <h3 className="font-medium text-sm">Order Items</h3>
            <div className="mt-2 grid grid-cols-[auto_auto_1fr_auto] gap-x-3 divide-y divide-border">
              {productRequestItems.map((item, index) => (
                <FormField
                  key={item.id}
                  name={`productRequestItems.createMany.data.${index}.quantity`}
                  render={({ field }) => (
                    <FormItem className="grid col-span-full grid-cols-subgrid items-center space-y-0 py-2">
                      <FormControl>
                        <>
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            onClick={() => remove(index)}
                          >
                            <Trash />
                          </Button>
                          <Input
                            type="number"
                            {...field}
                            className="w-16"
                            min={1}
                          />
                          <ProductRequestItem
                            product={subproductMap.get(item.productId)!}
                            onPreviewImage={previewImage.openData}
                            className="col-span-2 grid-cols-subgrid"
                            showAnsiCategory
                          />
                        </>
                      </FormControl>
                      <FormMessage className="col-span-full" />
                    </FormItem>
                  )}
                ></FormField>
              ))}
            </div>
            {productRequestItems.length === 0 && (
              <p className="text-muted-foreground text-sm">No order items.</p>
            )}
          </div>
          {renderSubmitButton({ isSubmitting, disabled: !isDirty || !isValid })}
        </form>
      </Form>
      <Dialog open={previewImage.open} onOpenChange={previewImage.setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Preview</DialogTitle>
          </DialogHeader>
          <img
            src={previewImage.data ?? "#"}
            alt="Preview"
            className="w-full rounded-lg"
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

function AvailableConsumables({
  consumables,
  onAdd,
  onPreviewImage,
  showAnsiCategory = false,
}: {
  consumables: Product[];
  onAdd: (productId: string) => void;
  onPreviewImage: (url: string) => void;
  showAnsiCategory?: boolean;
}) {
  return (
    <div className="mt-2 grid grid-cols-[auto_1fr_auto] gap-x-3 divide-y divide-border">
      {consumables.map((product) => (
        <div
          key={product.id}
          className="grid col-span-full grid-cols-subgrid items-center py-2"
        >
          <Button
            type="button"
            variant="default"
            size="icon"
            onClick={() => onAdd(product.id)}
          >
            <CirclePlus />
          </Button>
          <ProductRequestItem
            product={product}
            onPreviewImage={onPreviewImage}
            className="col-span-2 grid-cols-subgrid"
            showAnsiCategory={showAnsiCategory}
          />
        </div>
      ))}
      {consumables.length === 0 && (
        <p className="text-muted-foreground text-xs col-span-full flex items-center justify-center h-12">
          No consumables available.
        </p>
      )}
    </div>
  );
}

function ProductRequestItem({
  product,
  onPreviewImage,
  className,
  showAnsiCategory = false,
}: {
  product: Product;
  onPreviewImage?: (url: string) => void;
  className?: string;
  showAnsiCategory?: boolean;
}) {
  return (
    <div className={cn("grid grid-cols-[1fr_auto]", className)}>
      <div className="text-sm">
        {product.name}
        <div className="text-muted-foreground text-xs line-clamp-1">
          {product.description || <>&mdash;</>}
        </div>
      </div>
      <div className="flex items-center gap-x-2 justify-end">
        {showAnsiCategory && product.ansiCategory && (
          <AnsiCategoryDisplay ansiCategory={product.ansiCategory} iconOnly />
        )}
        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={!product.imageUrl}
          onClick={() => product.imageUrl && onPreviewImage?.(product.imageUrl)}
        >
          <Image />
        </Button>
      </div>
    </div>
  );
}

export function ProductRequestCard({ request }: { request: ProductRequest }) {
  return (
    <Card>
      <CardHeader>
        <CardDescription className="text-muted-foreground text-xs flex items-center gap-x-4 justify-between">
          <div className="flex items-center gap-x-2">
            {/* <Badge variant="default">{request.status}</Badge> */}
            <div className="text-foreground">
              {formatDistanceToNow(request.createdOn)}
            </div>
            <div>&mdash;</div>
            <div>{format(request.createdOn, "PPpp")}</div>
          </div>
          {/* <ProductRequestApprovalsDisplay
            approvals={request.productRequestApprovals ?? []}
          /> */}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-x-4 text-sm grid-cols-[auto_auto_1fr] divide-y divide-border">
          <div className="grid col-span-full grid-cols-subgrid items-center py-2 text-muted-foreground text-xs font-medium">
            <div>Qty</div>
            <div>Consumable</div>
          </div>
          {request.productRequestItems.map((item) => (
            <div
              key={item.id}
              className="grid col-span-full grid-cols-subgrid items-center py-2"
            >
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
        <ProductRequestApprovalIndicator
          key={approval.id}
          approval={approval}
        />
      ))}
      {approvals.length === 0 && (
        <ProductRequestApprovalIndicator key={"no approval"} approval={null} />
      )}
    </div>
  );
}

const getContrastTextColor = (bgColor: string) => {
  const hex = bgColor.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? "black" : "white";
};
