import { ChevronDown, ChevronUp, Nfc } from "lucide-react";
import type { Asset, Product } from "~/lib/models";
import { cn } from "~/lib/utils";
import { ProductImage } from "../products/product-card";
import ProductCategoryIcon from "../products/product-category-icon";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";

interface AssetCardProps {
  asset: Asset & { product: Product };
  processedProductImageUrl?: string | null;
  className?: string;
}

export default function AssetCard({
  asset,
  processedProductImageUrl,
  className,
}: AssetCardProps) {
  return (
    <Card className={cn("flex", className)}>
      <div className="flex flex-col">
        <ProductImage
          name={asset.product.name}
          imageUrl={processedProductImageUrl ?? asset.product.imageUrl}
          custom={!!asset.product.client}
          className={cn(
            "grow rounded-l-none rounded-tl-xl",
            !asset.tag && "rounded-bl-xl"
          )}
        />
        {asset.tag && (
          <div className="flex items-center justify-center gap-1 rounded-bl-xl w-32 sm:w-40 text-center bg-background border-t border-r border-border text-xs font-bold px-2 py-1">
            <Nfc className="size-4" />
            <div className="truncate">{asset.tag.serialNumber}</div>
          </div>
        )}
      </div>
      <div className="grow flex flex-col">
        <CardHeader className="p-4 sm:p-4">
          <CardTitle className="flex flex-wrap-reverse justify-between items-center">
            <div className="grid gap-1">
              <span>
                <ProductCategoryIcon category={asset.product.productCategory} />
                {asset.name}
              </span>
              <span className="text-xs text-muted-foreground">
                {asset.site && <>{asset.site.name} &mdash; </>}
                {asset.location} &mdash; {asset.placement}
              </span>
              <span className="text-xs font-light text-muted-foreground">
                Serial No. <pre className="inline">{asset.serialNumber}</pre>
              </span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-4 pt-0 sm:pt-0">
          <Collapsible>
            <CollapsibleTrigger asChild className="group">
              <Button variant="outline" size="xs">
                <span className="group-data-[state=open]:hidden">More</span>
                <span className="group-data-[state=open]:block hidden">
                  Less
                </span>
                <ChevronUp className="size-4 group-data-[state=open]:block hidden" />
                <ChevronDown className="size-4 group-data-[state=open]:hidden block" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="pt-4 grid gap-x-4 gap-y-2 grid-cols-[repeat(auto-fit,minmax(130px,1fr))]">
                {[
                  {
                    label: "Product",
                    value: asset.product.name,
                  },
                  {
                    label: "Category",
                    value: (
                      <div>
                        <ProductCategoryIcon
                          category={asset.product.productCategory}
                        />
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
                        <>
                          {asset.client.defaultInspectionCycle} days (client
                          default)
                        </>
                      ) : (
                        <>&mdash;</>
                      ),
                    hidden: asset.inspectionCycle === null && !asset.client,
                  },
                ]
                  .filter(({ hidden }) => !hidden)
                  .map(({ label, value }) => (
                    <div key={label} className="flex flex-col gap-0.5">
                      <span className="font-bold text-xs text-muted-foreground">
                        {label}
                      </span>
                      <span className="text-sm font-light">
                        {value ?? <>&mdash;</>}
                      </span>
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
