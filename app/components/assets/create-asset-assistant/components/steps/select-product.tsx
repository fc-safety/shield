import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, Factory } from "lucide-react";
import { useMemo, type ComponentProps } from "react";
import type { AccessIntent } from "~/.server/api-utils";
import Step from "~/components/assistant/components/step";
import { ProductImage } from "~/components/products/product-card";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { Skeleton } from "~/components/ui/skeleton";
import URLFavicon from "~/components/url-favicon";
import { useAuthenticatedFetch } from "~/hooks/use-authenticated-fetch";
import { useProxyImage } from "~/hooks/use-proxy-image";
import type { Product } from "~/lib/models";
import { cn } from "~/lib/utils";
import { getProductsQuery } from "../../services/product.service";

export default function StepSelectProduct({
  productId,
  setProductId,
  productCategoryId,
  clientId,
  accessIntent,
  onStepBackward,
  onContinue,
}: {
  productId?: string;
  setProductId: (productId: string) => void;
  productCategoryId?: string;
  clientId?: string;
  accessIntent?: AccessIntent;
  onStepBackward: () => void;
  onContinue: () => void;
}) {
  const { fetchOrThrow } = useAuthenticatedFetch();
  const { data: products, isLoading } = useQuery(
    getProductsQuery(fetchOrThrow, { productCategoryId, clientId, accessIntent })
  );

  const productsByManufacturer = useMemo(() => {
    return products?.reduce(
      (acc, product) => {
        if (!acc[product.manufacturer.id]) {
          acc[product.manufacturer.id] = [];
        }
        acc[product.manufacturer.id].push(product);
        return acc;
      },
      {} as Record<string, Product[]>
    );
  }, [products]);

  return (
    <Step
      title="Which product is this asset?"
      subtitle="Select a product to continue."
      onStepBackward={onStepBackward}
      onContinue={onContinue}
      continueDisabled={!productId}
    >
      <RadioGroup
        className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-8"
        value={productId ?? ""}
        onValueChange={(id) => {
          setProductId(id);
          onContinue();
        }}
      >
        {!isLoading &&
          productsByManufacturer &&
          Object.entries(productsByManufacturer).length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed p-4">
              <div className="text-muted-foreground text-center">
                <h3 className="text-2xl font-semibold">Oops!</h3>
                <p className="text-center text-sm">This category has no products.</p>
              </div>
              <Button variant="ghost" onClick={onStepBackward} type="button" size="sm">
                <ArrowLeft /> Go back
              </Button>
            </div>
          )}
        {isLoading
          ? Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={"loading-" + index} className="h-full min-h-18 w-full rounded-2xl" />
            ))
          : Object.entries(productsByManufacturer ?? {}).map(([manufacturerId, products]) => {
              const manufacturer = products[0].manufacturer;
              return (
                <div
                  key={manufacturerId}
                  className="col-span-full grid grid-cols-subgrid gap-2 sm:gap-4"
                >
                  <div className="col-span-full flex items-center gap-1 pt-2 text-sm font-bold">
                    {manufacturer.homeUrl ? (
                      <URLFavicon
                        url={manufacturer.homeUrl}
                        alt={manufacturer.name}
                        fallback={<Factory className="text-muted-foreground size-5" />}
                      />
                    ) : (
                      <Factory className="text-muted-foreground size-5" />
                    )}
                    <span className="line-clamp-2">{manufacturer.name}</span>
                  </div>
                  {products.map((product) => (
                    <div
                      key={product.id}
                      className={cn(
                        "bg-muted relative cursor-pointer rounded-2xl border transition-all",
                        "[&:has([data-state=checked])]:bg-transparent [&:has([data-state=checked])]:shadow-md",
                        "hover:bg-transparent hover:shadow-xl"
                      )}
                    >
                      <RadioGroupItem value={product.id} id={product.id} className="peer sr-only" />
                      <CheckCircle2 className="text-primary fill-primary/15 dark:fill-primary/25 absolute top-2 right-2 z-10 hidden size-6 peer-data-[state=checked]:block" />
                      <Label
                        htmlFor={product.id}
                        className={cn("block h-full cursor-pointer font-semibold")}
                      >
                        <div className="flex h-full w-full flex-col">
                          <OptimizedProductImage
                            imageUrl={product.imageUrl}
                            name={product.name}
                            className="h-24 min-h-24 w-full rounded-tl-2xl rounded-tr-2xl rounded-br-none rounded-bl-none border-r-0 transition-opacity hover:opacity-80 sm:w-full"
                          />
                          <div className="border-border border-t px-4 py-2 text-center">
                            {product.name}
                          </div>
                        </div>
                      </Label>
                    </div>
                  ))}
                </div>
              );
            })}
      </RadioGroup>
    </Step>
  );
}

StepSelectProduct.StepId = "select-product";

function OptimizedProductImage(props: ComponentProps<typeof ProductImage>) {
  if (!props.imageUrl) {
    return <ProductImage {...props} />;
  }

  const { proxyImageUrl: optimizedImageUrl } = useProxyImage({
    src: props.imageUrl,
    pre: "square",
    size: "160",
  });
  return <ProductImage {...props} imageUrl={optimizedImageUrl} />;
}
