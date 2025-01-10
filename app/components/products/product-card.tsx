import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageOff, Loader2 } from "lucide-react";
import { Suspense } from "react";
import { Await, Link, type To } from "react-router";
import { getImageWithBackgroundFillColor } from "~/lib/beta-utils";
import type { Product } from "~/lib/models";

interface ProductCardProps {
  product: Product | undefined;
  renderEditButton?: () => React.ReactNode;
  displayCategory?: boolean;
  displayManufacturer?: boolean;
  navigateTo?: To;
}

export default function ProductCard({
  product,
  renderEditButton,
  displayCategory = true,
  displayManufacturer = true,
  navigateTo,
}: ProductCardProps) {
  return (
    <Card className="flex">
      {product ? (
        <>
          <ProductImage name={product.name} imageUrl={product.imageUrl} />
          <div>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <div className="grid gap-2">
                  {displayManufacturer && (
                    <span className="text-xs text-muted-foreground">
                      {product.manufacturer.name}
                    </span>
                  )}
                  <span>
                    {navigateTo ? (
                      <Link to={navigateTo} className="hover:underline">
                        {product.name}
                      </Link>
                    ) : (
                      <span>{product.name}</span>
                    )}
                    {displayCategory && (
                      <Badge
                        className="text-xs uppercase w-max ml-2"
                        variant="secondary"
                      >
                        {product.productCategory.shortName ??
                          product.productCategory.name}
                      </Badge>
                    )}
                  </span>
                </div>
                {renderEditButton?.()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>{product.description ?? <>&mdash;</>}</p>
            </CardContent>
          </div>
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

function ProductImage({
  name,
  imageUrl,
}: {
  name: string;
  imageUrl?: string | null;
}) {
  return (
    <div className="rounded-l-xl h-48 aspect-square shrink-0 overflow-hidden">
      {imageUrl ? (
        <Suspense
          fallback={<div className="h-full w-full bg-muted animate-pulse" />}
        >
          <Await
            resolve={getImageWithBackgroundFillColor(imageUrl)}
            errorElement={<DefaultProductImage />}
          >
            {({ dataUrl, backgroundColor }) => (
              <div
                className="h-full w-full flex justify-center"
                style={{
                  backgroundColor,
                }}
              >
                <img src={dataUrl} alt={name} className="object-contain" />
              </div>
            )}
          </Await>
        </Suspense>
      ) : (
        <DefaultProductImage />
      )}
    </div>
  );
}

function DefaultProductImage() {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center bg-muted text-muted-foreground gap-2">
      <ImageOff className="size-12" />
      <span className="text-xs">No image</span>
    </div>
  );
}
