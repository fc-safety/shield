import { dehydrate, QueryClient } from "@tanstack/react-query";
import { ShieldQuestion } from "lucide-react";
import { api } from "~/.server/api";
import { getAuthenticatedFetcher } from "~/.server/api-utils";
import { guard } from "~/.server/guard";
import AssetQuestionsDataTable from "~/components/products/asset-questions-data-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { useAuth } from "~/contexts/auth-context";
import { getProductCategoriesQueryOptions } from "~/lib/services/product-categories.service";
import { getQueryPersistedState, getQueryStatePersistor } from "~/lib/urls";
import { can, isGlobalAdmin } from "~/lib/users";
import { buildTitleFromBreadcrumb, getSearchParams } from "~/lib/utils";
import type { Route } from "./+types/index";

export const handle = {
  breadcrumb: () => ({
    label: "Questions",
  }),
};

export const meta: Route.MetaFunction = ({ matches }) => {
  return [{ title: buildTitleFromBreadcrumb(matches) }];
};

export const loader = async ({ request }: Route.LoaderArgs) => {
  await guard(request, (user) => isGlobalAdmin(user) && can(user, "read", "asset-questions"));

  const searchParams = getSearchParams(request);

  // Fetch all products and product categories to get their questions
  const allQuestionsPromise = api.assetQuestions
    .list(
      request,
      {
        limit: 10000,
        order: {
          createdOn: "desc",
        },
        clientId: "_NULL",
      },
      { context: "admin" }
    )
    .then((r) => r.results);

  // Prefetch queries
  const queryClient = new QueryClient();
  const prefetchProductCategoriesPromise = queryClient.prefetchQuery(
    getProductCategoriesQueryOptions(getAuthenticatedFetcher(request))
  );

  const [allQuestions, _] = await Promise.all([
    allQuestionsPromise,
    prefetchProductCategoriesPromise,
  ]);

  return {
    questions: allQuestions,
    sorting: getQueryPersistedState("sorting", searchParams),
    columnFilters: getQueryPersistedState("columnFilters", searchParams),
    pagination: getQueryPersistedState("pagination", searchParams),
    dehydratedState: dehydrate(queryClient),
  };
};

export default function QuestionsIndex({ loaderData }: Route.ComponentProps) {
  const { user } = useAuth();

  const canManageQuestions = can(user, "manage", "asset-questions");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldQuestion className="h-5 w-5" />
          Global Asset Questions
        </CardTitle>
        <CardDescription>Questions presented to all clients.</CardDescription>
      </CardHeader>
      <CardContent>
        <AssetQuestionsDataTable
          questions={loaderData.questions}
          readOnly={!canManageQuestions}
          initialState={{
            sorting: loaderData.sorting,
            columnFilters: loaderData.columnFilters,
            pagination: loaderData.pagination,
          }}
          onSortingChange={getQueryStatePersistor("sorting")}
          onColumnFiltersChange={getQueryStatePersistor("columnFilters")}
          onPaginationChange={getQueryStatePersistor("pagination")}
        />
      </CardContent>
    </Card>
  );
}
