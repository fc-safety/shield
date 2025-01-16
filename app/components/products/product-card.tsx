import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageOff, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, type To } from "react-router";
import { getImageWithBackgroundFillColor } from "~/.client/image-utils";
import type { Product } from "~/lib/models";
import { cn } from "~/lib/utils";
import ActiveIndicator2 from "../active-indicator-2";
import Icon from "../icons/icon";

interface ProductCardProps {
  product: Product | undefined;
  renderEditButton?: () => React.ReactNode;
  displayCategory?: boolean;
  displayManufacturer?: boolean;
  displayActiveIndicator?: boolean;
  navigateTo?: To;
}

export default function ProductCard({
  product,
  renderEditButton,
  displayCategory = true,
  displayManufacturer = true,
  displayActiveIndicator = true,
  navigateTo,
}: ProductCardProps) {
  return (
    <Card className="flex">
      {product ? (
        <>
          <ProductImage name={product.name} imageUrl={product.imageUrl} />
          <div className="grow flex flex-col">
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <div className="grid gap-2">
                  {displayManufacturer && (
                    <span className="text-xs text-muted-foreground">
                      {product.manufacturer.name}
                    </span>
                  )}
                  {navigateTo ? (
                    <Link to={navigateTo} className="hover:underline">
                      {product.name}
                    </Link>
                  ) : (
                    <span>{product.name}</span>
                  )}
                </div>
                {renderEditButton?.()}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-4 justify-between">
              <p className="text-sm text-muted-foreground">
                {product.description ?? <>&mdash;</>}
              </p>
              <div className="flex gap-2 items-center">
                {displayCategory && (
                  <>
                    {product.productCategory.icon && (
                      <Icon
                        iconId={product.productCategory.icon}
                        color={product.productCategory.color ?? undefined}
                        className="text-xl"
                      />
                    )}
                    <Badge
                      className={cn("text-sm uppercase w-max")}
                      variant="secondary"
                    >
                      {product.productCategory.shortName ??
                        product.productCategory.name}
                    </Badge>
                  </>
                )}
                <div className="flex-1"></div>
                <ActiveIndicator2
                  active={product.active}
                  className={cn(!displayActiveIndicator && "hidden")}
                />
              </div>
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
  const [imageContext, setImageContext] = useState<{
    dataUrl: string;
    backgroundColor: string;
  }>();
  const [getDataUrlFailed, setGetDataUrlFailed] = useState(false);

  useEffect(() => {
    if (imageUrl) {
      getImageWithBackgroundFillColor(imageUrl)
        .then(({ dataUrl, backgroundColor }) => {
          setImageContext({ dataUrl, backgroundColor });
        })
        .catch(() => setGetDataUrlFailed(true));
    }
  }, [imageUrl]);

  return (
    <div className="rounded-l-xl w-48 min-h-48 shrink-0 overflow-hidden border-r">
      {imageUrl && !getDataUrlFailed ? (
        <>
          {imageContext ? (
            <div
              className="h-full w-full flex justify-center"
              style={{
                backgroundColor: imageContext.backgroundColor,
              }}
            >
              <img
                src={imageContext.dataUrl}
                alt={name}
                className="object-contain"
              />
            </div>
          ) : (
            <div className="h-full w-full bg-muted animate-pulse" />
          )}
        </>
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
