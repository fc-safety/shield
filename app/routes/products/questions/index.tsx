import { dehydrate, QueryClient } from "@tanstack/react-query";
import { ShieldQuestion } from "lucide-react";
import { api } from "~/.server/api";
import { getAuthenticatedFetcher } from "~/.server/api-utils";
import { requireUserSession } from "~/.server/user-sesssion";
import AssetQuestionsDataTable from "~/components/products/asset-questions-data-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { useAuth } from "~/contexts/auth-context";
import { getProductCategoriesQueryOptions } from "~/lib/services/product-categories.service";
import { getQueryPersistedState, getQueryStatePersistor } from "~/lib/urls";
import { can, isGlobalAdmin, isGlobalAdmin as isGlobalAdminFn } from "~/lib/users";
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
  const { user } = await requireUserSession(request);
  const isGlobalAdmin = isGlobalAdminFn(user);

  const searchParams = getSearchParams(request);

  // Check if user can manage asset questions
  if (!can(user, "read", "asset-questions")) {
    throw new Response("Forbidden", { status: 403 });
  }

  // Fetch all products and product categories to get their questions
  const allQuestionsPromise = api.assetQuestions
    .list(
      request,
      {
        limit: 10000,
        order: {
          createdOn: "desc",
        },
      },
      { context: isGlobalAdmin ? "admin" : "user" }
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
  const userIsGlobalAdmin = isGlobalAdmin(user);
  const viewContext = userIsGlobalAdmin ? "admin" : "user";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldQuestion className="h-5 w-5" />
          Asset Questions
        </CardTitle>
        <CardDescription>
          Manage questions that appear during asset setup and inspections
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AssetQuestionsDataTable
          questions={loaderData.questions}
          readOnly={!canManageQuestions}
          viewContext={viewContext}
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
