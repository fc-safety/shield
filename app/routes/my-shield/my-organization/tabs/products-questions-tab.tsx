import { useRouteLoaderData, type ShouldRevalidateFunctionArgs } from "react-router";
import { api } from "~/.server/api.js";
import ClientDetailsTabsProductsQuestionsTag from "~/components/clients/pages/client-details-tabs/products-questions-tab";
import type { loader as layoutLoader } from "../layout";
import type { Route } from "./+types/products-questions-tab.tsx";

export const shouldRevalidate = (arg: ShouldRevalidateFunctionArgs) => {
  const { formMethod, formAction } = arg;
  if (
    formMethod === "DELETE" &&
    formAction &&
    !(
      formAction.startsWith("/api/proxy/products") ||
      formAction.startsWith("/api/proxy/asset-questions")
    )
  ) {
    return false;
  }
  return arg.defaultShouldRevalidate;
};

export const loader = async ({ request }: Route.LoaderArgs) => {
  const [productResults, questionResults] = await Promise.all([
    api.products.list(request, { limit: 10000, clientId: { not: "_NULL" } }),
    api.assetQuestions.list(request, { limit: 10000, clientId: { not: "_NULL" } }),
  ]);

  return {
    products: productResults.results,
    productsTotalCount: productResults.count,
    questions: questionResults.results,
    questionsTotalCount: questionResults.count,
  };
};

export default function ProductsQuestionsTab({
  loaderData: { products, productsTotalCount, questions, questionsTotalCount },
}: Route.ComponentProps) {
  const layoutData = useRouteLoaderData<typeof layoutLoader>(
    "routes/my-shield/my-organization/layout"
  );

  return (
    <ClientDetailsTabsProductsQuestionsTag
      clientId={layoutData?.client?.id}
      products={products}
      productsTotalCount={productsTotalCount}
      questions={questions}
      questionsTotalCount={questionsTotalCount}
      readOnly={false}
    />
  );
}
