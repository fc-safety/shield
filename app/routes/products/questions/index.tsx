import { ShieldQuestion } from "lucide-react";
import { api } from "~/.server/api";
import { requireUserSession } from "~/.server/user-sesssion";
import AssetQuestionsDataTable from "~/components/products/asset-questions-data-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { useAuth } from "~/contexts/auth-context";
import { can, isGlobalAdmin as isGlobalAdminFn } from "~/lib/users";
import { buildTitleFromBreadcrumb } from "~/lib/utils";
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

  // Check if user can manage asset questions
  if (!can(user, "read", "asset-questions")) {
    throw new Response("Forbidden", { status: 403 });
  }

  // Fetch all products and product categories to get their questions
  const [questionsResponse, categoriesResponse] = await Promise.all([
    api.assetQuestions.list(
      request,
      {
        limit: 10000,
        order: {
          createdOn: "desc",
        },
      },
      { context: isGlobalAdmin ? "admin" : "user" }
    ),
    api.productCategories.list(request, { limit: 10000, order: { name: "asc" } }),
  ]);

  const allQuestions = questionsResponse.results;

  return {
    questions: allQuestions,
    categories: categoriesResponse.results,
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
          Asset Questions
        </CardTitle>
        <CardDescription>
          Manage questions that appear during asset setup and inspections
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AssetQuestionsDataTable
          questions={loaderData.questions}
          categories={loaderData.categories}
          readOnly={!canManageQuestions}
        />
      </CardContent>
    </Card>
  );
}
