import { Shield } from "lucide-react";
import type { ViewContext } from "~/.server/api-utils";
import AssetsTable from "~/components/assets/assets-table";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import type { Asset } from "~/lib/models";

export default function ClientDetailsTabsAssetsTab({
  assets,
  clientId,
  viewContext,
}: {
  assets: Asset[];
  clientId?: string;
  viewContext: ViewContext;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Shield /> Assets
        </CardTitle>
      </CardHeader>
      <CardContent>
        <AssetsTable assets={assets ?? []} clientId={clientId} viewContext={viewContext} />
      </CardContent>
    </Card>
  );
}
