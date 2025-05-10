import { Shield } from "lucide-react";
import { api } from "~/.server/api";
import AssetsTable from "~/components/assets/assets-table";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import type { Route } from "./+types/index";

export const loader = async ({ request }: Route.LoaderArgs) => {
  return api.assets.list(request, { limit: 10000 });
};

export default function AssetsIndex({
  loaderData: assets,
}: Route.ComponentProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Shield /> Assets
        </CardTitle>
      </CardHeader>
      <CardContent>
        <AssetsTable
          assets={assets.results}
          toDetailsRoute={(asset) => asset.id}
        />
      </CardContent>
    </Card>
  );
}
