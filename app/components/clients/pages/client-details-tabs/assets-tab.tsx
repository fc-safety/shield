import { Shield } from "lucide-react";
import type { ViewContext } from "~/.server/api-utils";
import AssetsTable from "~/components/assets/assets-table";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import type { Asset } from "~/lib/models";

export default function ClientDetailsTabsAssetsTab({
  assets,
  assetsTotalCount,
  clientId,
  viewContext,
}: {
  assets: Asset[];
  assetsTotalCount?: number;
  clientId?: string;
  viewContext: ViewContext;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Shield /> Assets <Badge>{assetsTotalCount ?? assets.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <AssetsTable assets={assets ?? []} clientId={clientId} viewContext={viewContext} />
      </CardContent>
    </Card>
  );
}
