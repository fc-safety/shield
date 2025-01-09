import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { Link, type To } from "react-router";
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
    <Card>
      {product ? (
        <>
          {product.imageUrl && (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-48 object-cover rounded-t-xl"
            />
          )}
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
