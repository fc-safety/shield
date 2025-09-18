import { Shield } from "lucide-react";
import { api } from "~/.server/api";
import AssetsTable from "~/components/assets/assets-table";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { getQueryPersistedState, getQueryStatePersistor } from "~/lib/urls";
import { getSearchParams } from "~/lib/utils";
import type { Route } from "./+types/index";

export const loader = async ({ request }: Route.LoaderArgs) => {
  const assets = await api.assets.list(request, { limit: 10000 });
  const searchParams = getSearchParams(request);
  return {
    assets,
    sorting: getQueryPersistedState("sorting", searchParams),
    columnFilters: getQueryPersistedState("columnFilters", searchParams),
    pagination: getQueryPersistedState("pagination", searchParams),
  };
};

export default function AssetsIndex({
  loaderData: { assets, sorting, columnFilters, pagination },
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
          initialState={{
            sorting: sorting,
            columnFilters: columnFilters,
            pagination: pagination,
          }}
          onSortingChange={getQueryStatePersistor("sorting")}
          onColumnFiltersChange={getQueryStatePersistor("columnFilters")}
          onPaginationChange={getQueryStatePersistor("pagination")}
        />
      </CardContent>
    </Card>
  );
}
