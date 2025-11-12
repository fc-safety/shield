import { redirect } from "react-router";
import { api } from "~/.server/api";
import { ProductRequestItemsDisplay } from "~/components/assets/product-requests";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { buildTitleFromBreadcrumb, getSearchParam } from "~/lib/utils";
import SuccessCircle from "../components/success-circle";
import type { Route } from "./+types/confirmation";

export const handle = {
  breadcrumb: () => ({ label: "Confirmed 🎉 | Supplies Ordered" }),
};

export const meta: Route.MetaFunction = ({ matches }) => {
  return [{ title: buildTitleFromBreadcrumb(matches) }];
};

export const loader = async ({ request }: Route.LoaderArgs) => {
  const requestId = getSearchParam(request, "rid");

  if (!requestId) {
    throw redirect("/inspect/reorder-supplies/");
  }

  const suppliesRequest = await api.productRequests.get(request, requestId);

  return { suppliesRequest };
};

export default function ReorderSuppliesConfirmation({
  loaderData: { suppliesRequest },
}: Route.ComponentProps) {
  return (
    <div className="flex max-w-md flex-col gap-4 self-center">
      <Card>
        <CardHeader className="flex-row items-center gap-4">
          <SuccessCircle className="size-10" />
          <div className="flex flex-col">
            <CardTitle>Thank you for your request!</CardTitle>
            <CardDescription>
              Your supplies request has been submitted successfully. 🎉
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm italic">
            Our team will contact your organization shortly to finalize payment and delivery
            details.
          </p>

          <h3 className="mt-6 text-sm leading-6 font-semibold">Request Details</h3>
          <ProductRequestItemsDisplay request={suppliesRequest} />
        </CardContent>
      </Card>
    </div>
  );
}
