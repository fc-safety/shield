import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Plus, Trash } from "lucide-react";
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
import type { Product, ProductRequest, ResultsPage } from "~/lib/models";
import { createAssetOrderRequestSchema } from "~/lib/schema";
import { ResponsiveDialog } from "../responsive-dialog";
import { Card, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { DialogFooter } from "../ui/dialog";
import { Input } from "../ui/input";

interface AssetOrderRequestsProps {
  assetId: string;
  parentProductId: string;
  productRequests: ProductRequest[];
}

export default function AssetOrderRequests({
  assetId,
  parentProductId,
  productRequests,
}: AssetOrderRequestsProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-4">
      {productRequests.length === 0 && (
        <p className="text-muted-foreground text-xs">
          No active supply requests.
        </p>
      )}

      {productRequests.map((request) => (
        <Card key={request.id}>
          <CardHeader>
            <CardDescription className="text-muted-foreground text-xs">
              {format(request.createdOn, "PPpp")}
            </CardDescription>
            <CardTitle>
              {request.status} - {request.productRequestItems.length} items
            </CardTitle>
          </CardHeader>
          {/* <CardContent></CardContent> */}
        </Card>
      ))}

      <ResponsiveDialog
        open={open}
        onOpenChange={setOpen}
        trigger={
          <Button type="submit" variant="secondary">
            New Supply Request
          </Button>
        }
        title="Supply Request"
        description="Please select which consumables and the quantities you would like to order."
        dialogClassName="sm:max-w-[425px]"
        render={({ isDesktop }) => (
          <AssetOrderRequestForm
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
    </div>
  );
}

type TForm = z.infer<typeof createAssetOrderRequestSchema>;
const resolver = zodResolver(createAssetOrderRequestSchema);

function AssetOrderRequestForm({
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
  const fetcher = useFetcher<ResultsPage<Product>>();

  const [subproducts, setSubproducts] = useState<Product[]>([]);
  const subproductMap = useMemo(() => {
    return new Map(subproducts.map((product) => [product.id, product]));
  }, [subproducts]);

  useEffect(() => {
    if (fetcher.state === "idle" && !fetcher.data) {
      fetcher.load(`/api/proxy/products/?parentProduct[id]=${parentProductId}`);
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

  const { createOrUpdateJson: submit, isSubmitting } = useModalSubmit({
    onSubmitted,
  });

  const handleSubmit = (data: TForm) => {
    submit(data, {
      path: `/api/proxy/order-requests`,
      id: undefined,
      query: {
        _throw: "false",
      },
    });
  };

  return (
    <Form {...form}>
      <form
        className="space-y-4 mt-4"
        onSubmit={form.handleSubmit(handleSubmit)}
      >
        <div>
          <h3 className="font-medium">Available Consumables</h3>
          <div className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 divide-y divide-border">
            {availableConsumables.map((product) => (
              <div
                key={product.id}
                className="grid col-span-full grid-cols-subgrid items-center py-2"
              >
                <Button
                  variant="default"
                  size="sm"
                  onClick={() =>
                    append({
                      productId: product.id,
                      quantity: 1,
                    })
                  }
                >
                  <Plus />
                  Add
                </Button>
                {product.name}
              </div>
            ))}
          </div>
          {availableConsumables.length === 0 && (
            <p className="text-muted-foreground text-sm">
              No consumables available.
            </p>
          )}
        </div>

        <div>
          <h3 className="font-medium">Order Items</h3>
          <div className="mt-2 grid grid-cols-[auto_auto_1fr] gap-x-3 divide-y divide-border">
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
                        {subproductMap.get(item.productId)?.name}
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
  );
}
