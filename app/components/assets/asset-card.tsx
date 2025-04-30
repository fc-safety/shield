import { ChevronDown, ChevronUp } from "lucide-react";
import type { Asset, Product } from "~/lib/models";
import { cn } from "~/lib/utils";
import Icon from "../icons/icon";
import { ProductImage } from "../products/product-card";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";

interface AssetCardProps {
  asset: Asset & { product: Product };
  className?: string;
}

export default function AssetCard({ asset, className }: AssetCardProps) {
  return (
    <Card className={cn("flex", className)}>
      <ProductImage
        name={asset.product.name}
        imageUrl={asset.product.imageUrl}
        custom={!!asset.product.client}
      />
      <div className="grow flex flex-col">
        <CardHeader className="p-4 sm:p-4">
          <CardTitle className="flex flex-wrap-reverse justify-between items-center">
            <div className="grid gap-1">
              <span>{asset.name}</span>
              <span className="text-xs text-muted-foreground">
                {asset.site && <>{asset.site.name} &mdash; </>}
                {asset.location} &mdash; {asset.placement}
              </span>
            </div>
            {asset.tag && (
              <div className="w-max border-2 rounded-lg text-xs flex border-secondary-foreground bg-secondary-foreground text-secondary overflow-hidden">
                <span className="font-medium py-0.5 px-2">Tag Serial No.</span>
                <pre className="font-mono font-thin bg-secondary text-secondary-foreground py-0.5 px-2">
                  {asset.tag.serialNumber}
                </pre>
              </div>
            )}
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
              <div className="pt-4 grid gap-x-4 gap-y-2 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
                {[
                  {
                    label: "Asset Serial No.",
                    value: asset.serialNumber,
                  },
                  {
                    label: "Product",
                    value: asset.product.name,
                  },
                  {
                    label: "Category",
                    value: (
                      <div>
                        {(asset.product.productCategory.icon ||
                          asset.product.productCategory.color) && (
                          <Icon
                            iconId={asset.product.productCategory.icon ?? "box"}
                            color={asset.product.productCategory.color}
                            className="text-sm mr-1"
                          />
                        )}
                        {asset.product.productCategory.name}
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
