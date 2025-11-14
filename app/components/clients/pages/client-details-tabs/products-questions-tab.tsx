import { PenOff, Shield } from "lucide-react";
import type { ViewContext } from "~/.server/api-utils";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "~/components/ui/empty";
import type { AssetQuestion, Product } from "~/lib/models";

export default function ClientDetailsTabsProductsQuestionsTag({
  viewContext,
  clientId,
  products,
  questions,
}: {
  viewContext: ViewContext;
  clientId?: string;
  products: Product[];
  questions: AssetQuestion[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Shield /> Products & Questions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <PenOff />
            </EmptyMedia>
            <EmptyTitle>Custom Products & Questions Not Yet Available</EmptyTitle>
            <EmptyDescription>
              Managing custom products and questions will be available in the future.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </CardContent>
    </Card>
  );
}
