import { differenceInDays, startOfDay } from "date-fns";
import { AlertTriangle, ChevronDown, ChevronUp, Nfc, RefreshCcwDot } from "lucide-react";
import { Fragment, useMemo } from "react";
import type { Asset, Product } from "~/lib/models";
import { cn } from "~/lib/utils";
import HydrationSafeFormattedDate from "../common/hydration-safe-formatted-date";
import { ProductImage } from "../products/product-card";
import ProductCategoryIcon from "../products/product-category-icon";
import { Button } from "../ui/button";
import { ButtonGroup, ButtonGroupSeparator } from "../ui/button-group";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";

interface AssetCardProps {
  asset: Asset & { product: Product };
  processedProductImageUrl?: string | null;
  className?: string;
}

const EXPIRES_SOON_THRESHOLD = 30;
const EXPIRED_THRESHOLD = 0;

export default function AssetCard({ asset, processedProductImageUrl, className }: AssetCardProps) {
  const displayExpiringSupplies = useMemo(
    () =>
      (asset.consumables ?? []).filter((consumable) => !!consumable.product?.displayExpirationDate),
    [asset.consumables]
  );

  const TODAY = startOfDay(new Date());

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
        <CardHeader className="p-3 sm:p-4">
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
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col justify-center gap-2 p-3 pt-0 sm:p-4 sm:pt-0">
          {displayExpiringSupplies.length > 0 && (
            <div>
              {/* <h4 className="text-muted-foreground text-xs font-bold">Supply Expirations</h4> */}
              <ButtonGroup className={cn("text-xs font-light")} orientation="vertical">
                {displayExpiringSupplies.map((supply, idx) => {
                  const expiresInDays = supply.expiresOn
                    ? differenceInDays(startOfDay(supply.expiresOn), TODAY)
                    : null;

                  return (
                    <Fragment key={supply.id}>
                      {idx > 0 && displayExpiringSupplies.length > 1 && (
                        <ButtonGroupSeparator orientation="horizontal" />
                      )}
                      <div
                        className={cn(
                          "flex items-center justify-between gap-2 rounded-md px-2 py-1",
                          {
                            "bg-status-compliant text-status-compliant-foreground":
                              expiresInDays !== null && expiresInDays >= EXPIRES_SOON_THRESHOLD,
                            "bg-status-due-soon text-status-due-soon-foreground":
                              expiresInDays !== null &&
                              expiresInDays >= EXPIRED_THRESHOLD &&
                              expiresInDays < EXPIRES_SOON_THRESHOLD,
                            "bg-status-non-compliant text-status-non-compliant-foreground":
                              expiresInDays !== null && expiresInDays < EXPIRED_THRESHOLD,
                            "bg-status-never text-status-never-foreground": expiresInDays === null,
                          }
                        )}
                      >
                        <div>
                          <span className="font-semibold">{supply.product.name}</span>{" "}
                          {supply.expiresOn && expiresInDays !== null ? (
                            expiresInDays >= 0 ? (
                              <>
                                expiring on{" "}
                                <HydrationSafeFormattedDate
                                  date={supply.expiresOn}
                                  formatStr="PP"
                                  className="font-semibold"
                                />
                                .
                              </>
                            ) : (
                              <span className="font-semibold">expired.</span>
                            )
                          ) : (
                            "– no expiration set."
                          )}
                        </div>
                        {expiresInDays !== null && expiresInDays < 0 && (
                          <AlertTriangle className="size-4" />
                        )}
                      </div>
                    </Fragment>
                  );
                })}
              </ButtonGroup>
            </div>
          )}
          <Collapsible>
            <CollapsibleTrigger asChild className="group hidden">
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
        <CardFooter className="justify-between gap-3 p-3 pt-0 sm:gap-4 sm:p-4 sm:pt-0">
          <span className="text-muted-foreground font-mono text-xs font-light">
            SN: <span className="break-all">{asset.serialNumber}</span>
          </span>
          {(asset.inspectionCycle !== null || asset.client) && (
            <div className="text-muted-foreground flex shrink-0 items-center gap-1 text-xs">
              <RefreshCcwDot className="size-3.5" />
              <span>
                {asset.inspectionCycle !== null
                  ? asset.inspectionCycle
                  : asset.client?.defaultInspectionCycle}{" "}
                days
              </span>
            </div>
          )}
        </CardFooter>
      </div>
    </Card>
  );
}
