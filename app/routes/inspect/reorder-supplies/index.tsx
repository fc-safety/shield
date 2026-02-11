import { dehydrate, QueryClient } from "@tanstack/react-query";
import { redirect, useNavigate } from "react-router";
import { api } from "~/.server/api";
import { catchResponse, getAuthenticatedFetcher } from "~/.server/api-utils";
import { validateInspectionSession } from "~/.server/inspections";
import {
  getSuppliesForProductQuery,
  ProductRequestForm,
} from "~/components/assets/product-requests";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { buildTitleFromBreadcrumb } from "~/lib/utils";
import type { Route } from "./+types/index";

export const handle = {
  breadcrumb: () => ({ label: "Reorder Supplies" }),
};

export const meta: Route.MetaFunction = ({ matches }) => {
  return [{ title: buildTitleFromBreadcrumb(matches) }];
};

export const loader = async ({ request }: Route.LoaderArgs) => {
  const { inspectionToken } = await validateInspectionSession(request);

  const {
    data: { data: tagWithAccessContext },
  } = await catchResponse(api.tags.checkRegistration(request, inspectionToken), {
    codes: [404],
  });

  const { tag } = tagWithAccessContext ?? {};

  if (tag?.asset) {
    const queryClient = new QueryClient();
    await queryClient.prefetchQuery(
      getSuppliesForProductQuery(getAuthenticatedFetcher(request), tag.asset.productId)
    );

    return {
      asset: tag.asset,
      dehydratedState: dehydrate(queryClient),
    };
  }

  throw redirect("/inspect/register/");
};

export default function ReorderSupplies({ loaderData: { asset } }: Route.ComponentProps) {
  const navigate = useNavigate();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Reorder Supplies</CardTitle>
        <CardDescription>
          Please select which supplies and the quantities you would like to order.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ProductRequestForm
          assetId={asset.id}
          parentProductId={asset.productId}
          renderFormFooter={({ renderDefault }) => renderDefault({ align: "center" })}
          onSuccess={({ id }) => {
            navigate("/inspect/reorder-supplies/confirmation/?rid=" + id);
          }}
        />
      </CardContent>
    </Card>
  );
}
