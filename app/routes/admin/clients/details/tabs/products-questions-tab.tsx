import { api } from "~/.server/api.js";
import ClientDetailsTabsProductsQuestionsTag from "~/components/clients/pages/client-details-tabs/products-questions-tab";
import { validateParam } from "~/lib/utils";
import type { Route } from "./+types/products-questions-tab.tsx";

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const id = validateParam(params, "id");

  //   const sitesResult = await api.sites.list(request, { clientId: id });
  const [productResults, questionResults] = await Promise.all([
    api.products.list(request, { limit: 10000, clientId: id }, { context: "admin" }),
    api.assetQuestions.list(request, { limit: 10000, clientId: id }, { context: "admin" }),
  ]);

  return {
    clientId: id,
    products: productResults.results,
    questions: questionResults.results,
  };
};

export default function ProductsQuestionsTab({
  loaderData: { clientId, products, questions },
}: Route.ComponentProps) {
  return (
    <ClientDetailsTabsProductsQuestionsTag
      clientId={clientId}
      products={products}
      questions={questions}
      viewContext="admin"
      readOnly={false}
    />
  );
}
