import type { ShouldRevalidateFunctionArgs } from "react-router";
import { api } from "~/.server/api.js";
import ClientDetailsTabsProductsQuestionsTag from "~/components/clients/pages/client-details-tabs/products-questions-tab";
import { validateParam } from "~/lib/utils";
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

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const id = validateParam(params, "id");

  // Use the `clientId` both to filter and to specify intended context.
  const [productResults, questionResults] = await Promise.all([
    api.products.list(
      request,
      { limit: 10000, clientId: id },
      { clientId: id, accessIntent: "elevated" }
    ),
    api.assetQuestions.list(
      request,
      { limit: 10000, clientId: id },
      { clientId: id, accessIntent: "elevated" }
    ),
  ]);

  return {
    clientId: id,
    products: productResults.results,
    productsTotalCount: productResults.count,
    questions: questionResults.results,
    questionsTotalCount: questionResults.count,
  };
};

export default function ProductsQuestionsTab({
  loaderData: { clientId, products, productsTotalCount, questions, questionsTotalCount },
}: Route.ComponentProps) {
  return (
    <ClientDetailsTabsProductsQuestionsTag
      clientId={clientId}
      products={products}
      productsTotalCount={productsTotalCount}
      questions={questions}
      questionsTotalCount={questionsTotalCount}
      readOnly={false}
    />
  );
}
