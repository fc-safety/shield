import { ChevronDown, ChevronUp, Nfc } from "lucide-react";
import type { Asset, Product } from "~/lib/models";
import { cn } from "~/lib/utils";
import { ProductImage } from "../products/product-card";
import ProductCategoryIcon from "../products/product-category-icon";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";

interface AssetCardProps {
  asset: Asset & { product: Product };
  processedProductImageUrl?: string | null;
  className?: string;
}

export default function AssetCard({ asset, processedProductImageUrl, className }: AssetCardProps) {
  return (
    <Card className={cn("flex", className)}>
      <div className="flex flex-col">
        <ProductImage
          name={asset.product.name}
          imageUrl={processedProductImageUrl ?? asset.product.imageUrl}
          custom={!!asset.product.client}
          className={cn("grow rounded-l-none rounded-tl-xl", !asset.tag && "rounded-bl-xl")}
        />
        {asset.tag && (
          <div className="bg-background border-border flex w-32 items-center justify-center gap-1 rounded-bl-xl border-t border-r px-2 py-1 text-center text-xs font-bold sm:w-40">
            <Nfc className="size-4" />
            <div className="truncate">{asset.tag.serialNumber}</div>
          </div>
        )}
      </div>
      <div className="flex grow flex-col">
        <CardHeader className="p-4 sm:p-4">
          <CardTitle className="flex flex-wrap-reverse items-center justify-between">
            <div className="grid gap-1">
              <span>
                <ProductCategoryIcon category={asset.product.productCategory} />
                {asset.name ||
                  [asset.product?.manufacturer?.name, asset.product?.name]
                    .filter(Boolean)
                    .join(" ")}
              </span>
              <span className="text-muted-foreground text-xs">
                {asset.site && <>{asset.site.name} &mdash; </>}
                {asset.location} &mdash; {asset.placement}
              </span>
              <span className="text-muted-foreground text-xs font-light">
                Serial No. <pre className="inline">{asset.serialNumber}</pre>
              </span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-4 sm:pt-0">
          <Collapsible>
            <CollapsibleTrigger asChild className="group">
              <Button variant="outline" size="xs">
                <span className="group-data-[state=open]:hidden">More</span>
                <span className="hidden group-data-[state=open]:block">Less</span>
                <ChevronUp className="hidden size-4 group-data-[state=open]:block" />
                <ChevronDown className="block size-4 group-data-[state=open]:hidden" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(130px,1fr))] gap-x-4 gap-y-2 pt-4">
                {[
                  {
                    label: "Product",
                    value: asset.product.name,
                  },
                  {
                    label: "Category",
                    value: (
                      <div>
                        <ProductCategoryIcon category={asset.product.productCategory} />
                        {asset.product.productCategory.name}{" "}
                        {asset.product.productCategory.shortName &&
                          `(${asset.product.productCategory.shortName})`}
                      </div>
                    ),
                  },
                  {
                    label: "Inspection Cycle",
                    value:
                      asset.inspectionCycle !== null ? (
                        <>{asset.inspectionCycle} days</>
                      ) : asset.client ? (
                        <>{asset.client.defaultInspectionCycle} days (client default)</>
                      ) : (
                        <>&mdash;</>
                      ),
                    hidden: asset.inspectionCycle === null && !asset.client,
                  },
                ]
                  .filter(({ hidden }) => !hidden)
                  .map(({ label, value }) => (
                    <div key={label} className="flex flex-col gap-0.5">
                      <span className="text-muted-foreground text-xs font-bold">{label}</span>
                      <span className="text-sm font-light">{value ?? <>&mdash;</>}</span>
                    </div>
                  ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </div>
    </Card>
  );
}
