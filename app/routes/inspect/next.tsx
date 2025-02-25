import { motion } from "framer-motion";
import { CheckCircle } from "lucide-react";
import { data } from "react-router";
import { api } from "~/.server/api";
import { getNextPointFromSession } from "~/.server/inspections";
import { getSessionValue, inspectionSessionStorage } from "~/.server/sessions";
import DataList from "~/components/data-list";
import RouteProgressCard from "~/components/inspections/route-progress-card";
import ProductCard from "~/components/products/product-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import type { Asset } from "~/lib/models";
import { getSearchParam } from "~/lib/utils";
import type { Route } from "./+types/next";

export const loader = async ({ request }: Route.LoaderArgs) => {
  const success = getSearchParam(request, "success");
  const showSuccessfulInspection = success !== null;

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
        showSuccessfulInspection,
      },
      init ?? undefined
    );
  }

  return {
    session: null,
    nextPoint: null,
    nextAsset: null,
    routeCompleted: false,
    showSuccessfulInspection,
  };
};

export default function InspectNext({
  loaderData: { nextAsset, routeCompleted, showSuccessfulInspection, session },
}: Route.ComponentProps) {
  return (
    <div className="grid gap-4">
      {showSuccessfulInspection && (
        <Card className="text-center">
          <CardHeader>
            <div className="flex flex-col items-center gap-2">
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  duration: 0.4,
                  scale: { type: "spring", visualDuration: 0.4, bounce: 0.5 },
                }}
              >
                <CheckCircle className="size-16 text-primary" />
              </motion.div>
              Inspection successfully submitted!
            </div>
          </CardHeader>
        </Card>
      )}
      {session && <RouteProgressCard activeSession={session} />}
      {nextAsset && (
        <Card>
          <CardHeader>
            <CardTitle>Go to Next Asset in Route</CardTitle>
            <CardDescription>
              When you get to the next asset in the route, tap the NFC tag to
              inspect.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <h3 className="text-base font-semibold">Details</h3>
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
              <h3 className="text-base font-semibold">Product</h3>
              <ProductCard product={nextAsset.product} />
            </div>
          </CardContent>
        </Card>
      )}
      {!nextAsset && routeCompleted && (
        <Card className="text-center">
          <CardHeader>
            <CardTitle className="justify-center">
              Inspection Route Completed
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm grid gap-4">
            <p>
              You have completed inspecting all assets in the route. Thank you
              for your inspections!
            </p>
            <p className="text-xs text-muted-foreground">
              To continue inspecting and/or begin a new route, please scan an
              asset&apos;s NFC tag.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
