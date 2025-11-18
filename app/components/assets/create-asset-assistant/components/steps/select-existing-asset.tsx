import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, Shapes, SquareSlash } from "lucide-react";
import { useMemo, type ComponentProps } from "react";
import type { ViewContext } from "~/.server/api-utils";
import Step from "~/components/assistant/components/step";
import Icon from "~/components/icons/icon";
import { ProductImage } from "~/components/products/product-card";
import { Button } from "~/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "~/components/ui/empty";
import { Label } from "~/components/ui/label";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { Skeleton } from "~/components/ui/skeleton";
import { useAuthenticatedFetch } from "~/hooks/use-authenticated-fetch";
import { useProxyImage } from "~/hooks/use-proxy-image";
import type { Asset } from "~/lib/models";
import { cn } from "~/lib/utils";
import { getAssetsQuery } from "../../services/asset.service";

export default function StepSelectExistingAsset({
  onStepBackward,
  onContinue,
  assetId,
  setAssetId,
  siteId,
  clientId,
  viewContext = "user",
  continueLabel,
}: {
  onStepBackward: () => void;
  onContinue: (data: Asset) => void;
  assetId: string | undefined;
  setAssetId: (assetId: string) => void;
  siteId?: string;
  clientId?: string;
  viewContext?: ViewContext;
  continueLabel?: string;
}) {
  const { fetchOrThrow } = useAuthenticatedFetch();
  const { data: assets, isLoading } = useQuery(
    getAssetsQuery(fetchOrThrow, { siteId, clientId, context: viewContext, noTag: true })
  );

  const selectedAsset = useMemo(() => {
    return assets?.find((asset) => asset.id === assetId);
  }, [assets, assetId]);

  const assetsByCategory = useMemo(() => {
    return assets?.reduce(
      (acc, asset) => {
        if (!acc[asset.product.productCategoryId]) {
          acc[asset.product.productCategoryId] = [];
        }
        acc[asset.product.productCategoryId].push(asset);
        return acc;
      },
      {} as Record<string, Asset[]>
    );
  }, [assets]);

  const handleContinue = (id?: string) => {
    if (id) {
      const asset = assets?.find((asset) => asset.id === id);
      if (asset) {
        onContinue(asset);
      }
    } else if (selectedAsset) {
      onContinue(selectedAsset);
    }
  };

  return (
    <Step
      title="Which existing asset will be registered with this tag?"
      subtitle="Select an asset to continue."
      onStepBackward={onStepBackward}
      onContinue={handleContinue}
      continueDisabled={!selectedAsset}
      continueButtonText={continueLabel}
    >
      <RadioGroup
        className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-8"
        value={assetId ?? ""}
        onValueChange={(id) => {
          setAssetId(id);
        }}
      >
        {!isLoading && assetsByCategory && Object.entries(assetsByCategory).length === 0 && (
          // <div className="col-span-full flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed p-4">
          //   <div className="text-muted-foreground text-center">
          //     <h3 className="text-2xl font-semibold">Oops!</h3>
          //     <p className="text-center text-sm">
          //       Looks like all existing assets have been registered.
          //     </p>
          //   </div>
          //   <Button variant="ghost" onClick={onStepBackward} type="button" size="sm">
          //     <ArrowLeft /> Go back
          //   </Button>
          // </div>
          <Empty className="col-span-full border border-dashed">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <SquareSlash />
              </EmptyMedia>
              <EmptyTitle>Oops!</EmptyTitle>
              <EmptyDescription>
                Looks like all existing assets have been registered.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button variant="secondary" onClick={onStepBackward} type="button" size="sm">
                <ArrowLeft /> Go back
              </Button>
            </EmptyContent>
          </Empty>
        )}
        {isLoading
          ? Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={"loading-" + index} className="h-full min-h-18 w-full rounded-2xl" />
            ))
          : Object.entries(assetsByCategory ?? {}).map(([categoryId, assets]) => {
              const category = assets[0].product.productCategory;
              return (
                <div
                  key={categoryId}
                  className="col-span-full grid grid-cols-subgrid gap-2 sm:gap-4"
                >
                  <div className="col-span-full flex items-center gap-1 pt-2 text-xs font-bold">
                    {category.icon ? (
                      <Icon iconId={category.icon} color={category.color} className="text-base" />
                    ) : (
                      <Shapes className="text-muted-foreground size-4" />
                    )}
                    <span className="line-clamp-2">{category.name}</span>
                  </div>
                  {assets.map((asset) => (
                    <div
                      key={asset.id}
                      className={cn(
                        "bg-muted relative cursor-pointer rounded-2xl border transition-all",
                        "[&:has([data-state=checked])]:bg-transparent [&:has([data-state=checked])]:shadow-md",
                        "hover:bg-transparent hover:shadow-xl"
                      )}
                    >
                      <RadioGroupItem value={asset.id} id={asset.id} className="peer sr-only" />
                      <CheckCircle2 className="text-primary fill-primary/15 dark:fill-primary/25 absolute top-2 right-2 z-10 hidden size-6 peer-data-[state=checked]:block" />
                      <Label
                        htmlFor={asset.id}
                        className={cn("block h-full cursor-pointer font-semibold")}
                      >
                        <div className="flex h-full w-full flex-col">
                          <OptimizedProductImage
                            imageUrl={asset.product.imageUrl}
                            name={asset.product.name}
                            className="h-24 min-h-24 w-full rounded-tl-2xl rounded-tr-2xl rounded-br-none rounded-bl-none border-r-0 transition-opacity hover:opacity-80 sm:w-full"
                          />
                          <div className="border-border border-t px-4 py-2 text-center">
                            {asset.name}
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

StepSelectExistingAsset.StepId = "select-existing-asset";

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
