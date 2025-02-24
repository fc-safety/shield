import { data } from "react-router";
import { api } from "~/.server/api";
import { getNextPointFromSession } from "~/.server/inspections";
import { getSessionValue, inspectionSessionStorage } from "~/.server/sessions";
import DataList from "~/components/data-list";
import ProductCard from "~/components/products/product-card";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import type { Asset } from "~/lib/models";
import type { Route } from "./+types/next";

export const loader = async ({ request }: Route.LoaderArgs) => {
  const activeSessionId = await getSessionValue(
    request,
    inspectionSessionStorage,
    "activeSession"
  );
  if (activeSessionId) {
    const inspectionsResponse = await api.inspections
      .getSession(request, activeSessionId)
      .mapTo((session) => ({
        session,
        ...getNextPointFromSession(session),
      }));

    const {
      data: { session, nextPoint, routeCompleted },
    } = inspectionsResponse;
    let init = inspectionsResponse.init;

    let nextAsset: Asset | null = null;
    if (nextPoint) {
      const assetResponse = await api.assets
        .get(request, nextPoint.assetId)
        .mergeInit(init);
      init = assetResponse.init;
      nextAsset = assetResponse.data;
    } else if (routeCompleted) {
      const completeResponse = await api.inspections
        .completeSession(request, session.id)
        .mergeInit(init);
      init = completeResponse.init;
    }

    return data(
      {
        session,
        nextPoint,
        nextAsset,
        routeCompleted,
      },
      init ?? undefined
    );
  }

  return {
    session: null,
    nextPoint: null,
    nextAsset: null,
    routeCompleted: false,
  };
};

export default function InspectNext({
  loaderData: { nextAsset, routeCompleted },
}: Route.ComponentProps) {
  return (
    <div className="grid gap-4">
      <Card className="text-center">
        <CardHeader>
          <CardTitle>Inspection submitted!</CardTitle>
        </CardHeader>
      </Card>
      {nextAsset && (
        <Card>
          <CardHeader>
            <CardTitle>Next Asset to Inspect</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              <h3 className="text-lg font-semibold">Details</h3>
              <DataList
                details={[
                  {
                    label: "Name",
                    value: nextAsset.name,
                  },
                  {
                    label: "Location",
                    value: nextAsset.location,
                  },
                  {
                    label: "Placement",
                    value: nextAsset.placement,
                  },
                  {
                    label: "Tag Serial No.",
                    value: nextAsset.tag?.serialNumber,
                  },
                ]}
                defaultValue={<>&mdash;</>}
              />
            </div>
            <div className="grid gap-2">
              <h3 className="text-lg font-semibold">Product</h3>
              <ProductCard product={nextAsset.product} />
            </div>
          </CardContent>
        </Card>
      )}
      {!nextAsset && routeCompleted && (
        <Card>
          <CardHeader>
            <CardTitle>Inspection Route Completed</CardTitle>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}
