import { api } from "~/.server/api.js";
import { requireUserSession } from "~/.server/user-sesssion.js";
import ClientDetailsTabsProductsQuestionsTag from "~/components/clients/pages/client-details-tabs/products-questions-tab";
import type { Route } from "./+types/products-questions-tab.tsx";

export const loader = async ({ request }: Route.LoaderArgs) => {
  const { user } = await requireUserSession(request);
  const clientId = await api.clients
    .list(request, {
      limit: 1,
      externalId: user.clientId,
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
      viewContext="user"
    />
  );
}
