import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageOff, Loader2 } from "lucide-react";
import { useCallback, useState } from "react";
import { Link, type To } from "react-router";
import type { Product } from "~/lib/models";
import { cn } from "~/lib/utils";
import ActiveIndicator2 from "../active-indicator-2";
import Icon from "../icons/icon";
import { AnsiCategoryDisplay } from "./ansi-category-combobox";

interface ProductCardProps {
  product: Product | undefined;
  optimizedImageUrl?: string | null;
  renderEditButton?: () => React.ReactNode;
  displayCategory?: boolean;
  displayManufacturer?: boolean;
  displayActiveIndicator?: boolean;
  navigateTo?: To;
  className?: string;
}

export default function ProductCard({
  product,
  optimizedImageUrl,
  renderEditButton,
  displayCategory = true,
  displayManufacturer = true,
  displayActiveIndicator = true,
  navigateTo,
  className,
}: ProductCardProps) {
  return (
    <Card className={cn("flex", className)}>
      {product ? (
        <>
          <ProductImage
            name={product.name}
            imageUrl={optimizedImageUrl ?? product.imageUrl}
            custom={!!product.client}
            navigateTo={navigateTo}
          />
          <div className="grow flex flex-col">
            <CardHeader className="p-2 sm:p-4">
              <CardTitle className="flex justify-between items-center">
                <div className="grid gap-1">
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
                  {product.sku && (
                    <span className="text-xs font-light text-muted-foreground">
                      SKU: {product.sku}
                    </span>
                  )}
                </div>
                {renderEditButton?.()}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-2 justify-between p-2 sm:p-4 pt-0 sm:pt-0">
              <p className="text-xs text-muted-foreground inline-flex flex-col justify-between gap-1">
                {product.description ?? <>&mdash;</>}
                {product.client && (
                  <span className="mt-2 text-xs text-muted-foreground">
                    Owner: {product.client.name}
                  </span>
                )}
              </p>
              <div className="flex gap-2 items-center">
                {displayCategory &&
                  (product.ansiCategory ? (
                    <AnsiCategoryDisplay ansiCategory={product.ansiCategory} />
                  ) : (
                    <>
                      {product.productCategory.icon && (
                        <Icon
                          iconId={product.productCategory.icon}
                          color={product.productCategory.color}
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
                  ))}
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

export function ProductImage({
  name,
  imageUrl,
  className,
  custom = false,
  navigateTo,
}: {
  name: string;
  imageUrl?: string | null;
  className?: string;
  custom?: boolean;
  navigateTo?: To;
}) {
  const Container = useCallback(
    ({
      children,
      ...props
    }: Omit<React.ComponentProps<typeof Link>, "to"> &
      React.ComponentProps<"div">) => {
      return navigateTo ? (
        <Link to={navigateTo} {...props}>
          {children}
        </Link>
      ) : (
        <div {...props}>{children}</div>
      );
    },
    [navigateTo]
  );

  const [error, setError] = useState<Error | null>(null);

  return (
    <Container
      className={cn(
        "relative rounded-l-xl w-32 sm:w-40 min-h-36 shrink-0 overflow-hidden border-r",
        className
      )}
    >
      {custom && (
        <div
          className={cn(
            "absolute top-0 left-0 w-full",
            "p-0.5 text-xs text-center",
            "bg-important text-important-foreground"
          )}
        >
          Custom
        </div>
      )}
      {imageUrl && !error ? (
        <img
          src={imageUrl}
          alt={name}
          className="h-full w-full object-contain bg-white"
          loading="lazy"
          onError={(e) =>
            setError(new Error("Failed to load image", { cause: e }))
          }
        />
      ) : (
        <DefaultProductImage />
      )}
    </Container>
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
