import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Product } from "~/lib/models";

interface ProductCardProps {
  product: Product;
  renderEditButton?: () => React.ReactNode;
  displayCategory?: boolean;
  displayManufacturer?: boolean;
}

export default function ProductCard({
  product,
  renderEditButton,
  displayCategory = true,
  displayManufacturer = true,
}: ProductCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <div className="grid gap-2">
            {displayManufacturer && (
              <span className="text-xs text-muted-foreground">
                {product.manufacturer.name}
              </span>
            )}
            <span>
              {product.name}
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
    </Card>
  );
}
