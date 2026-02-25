import type { ShouldRevalidateFunctionArgs } from "react-router";
import { api } from "~/.server/api.js";
import { requireUserSession } from "~/.server/user-sesssion.js";
import ClientDetailsTabsProductsQuestionsTag from "~/components/clients/pages/client-details-tabs/products-questions-tab";
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
  const { user } = await requireUserSession(request);
  const clientId = await api.clients
    .list(request, {
      limit: 1,
      id: user.activeClientId,
    })
    .then((r) => r.results.at(0)?.id);

  //   const sitesResult = await api.sites.list(request, { clientId: id });
  const [productResults, questionResults] = await Promise.all([
    api.products.list(request, { limit: 10000, clientId }),
    api.assetQuestions.list(request, { limit: 10000, clientId }),
  ]);

  return {
    clientId,
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
      readOnly
    />
  );
}
