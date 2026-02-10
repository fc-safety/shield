import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { AlertCircle, Plus, RefreshCw } from "lucide-react";
import { redirect } from "react-router";
import { Fragment } from "react/jsx-runtime";
import { toast } from "sonner";
import { api } from "~/.server/api";
import { buildImageProxyUrl } from "~/.server/images";
import { getNextPointFromSession } from "~/.server/inspections";
import { getSession, getSessionValue, inspectionSessionStorage } from "~/.server/sessions";
import AssetCard from "~/components/assets/asset-card";
import DisplayInspectionValue from "~/components/assets/display-inspection-value";
import {
  getSuppliesForProductQuery,
  NewSupplyRequestButton,
} from "~/components/assets/product-requests";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import VaultUploadInput from "~/components/vault-upload-input";
import { useAuth } from "~/contexts/auth-context";
import { useAuthenticatedFetch } from "~/hooks/use-authenticated-fetch";
import { useModalFetcher } from "~/hooks/use-modal-fetcher";
import type { Asset, Inspection } from "~/lib/models";
import { CAPABILITIES } from "~/lib/permissions";
import { can } from "~/lib/users";
import { buildTitleFromBreadcrumb, getSearchParam } from "~/lib/utils";
import RouteProgressCard from "~/routes/inspect/components/route-progress-card";
import type { Route } from "./+types/next";
import SuccessCircle from "./components/success-circle";

export const handle = {
  breadcrumb: () => ({ label: "Next" }),
};

export const meta: Route.MetaFunction = ({ matches }) => {
  return [{ title: buildTitleFromBreadcrumb(matches) }];
};

export const loader = async ({ request }: Route.LoaderArgs) => {
  const inspectionId = getSearchParam(request, "inspectionId");
  const success = getSearchParam(request, "success");
  const showSuccessfulInspection = success !== null;

  let activeSessionId: string | null | undefined = getSearchParam(request, "sessionId");
  const inspectionSession = await getSession(request, inspectionSessionStorage);

  if (activeSessionId) {
    inspectionSession.set("activeSession", activeSessionId);
    throw redirect(".", {
      headers: {
        "Set-Cookie": await inspectionSessionStorage.commitSession(inspectionSession),
      },
    });
  }

  activeSessionId = await getSessionValue(request, inspectionSessionStorage, "activeSession");

  let inspection: Inspection | null = null;
  if (inspectionId) {
    inspection = await api.inspections.get(request, inspectionId);
  }

  if (activeSessionId) {
    const { session, nextPoint } = await api.inspections
      .getSession(request, activeSessionId)
      .then((session) => ({
        session,
        ...getNextPointFromSession(session),
      }));

    let nextAsset: Asset | null = null;
    if (nextPoint) {
      nextAsset = await api.assets.get(request, nextPoint.assetId);
    }

    let processedProductImageUrl: string | null | undefined = null;
    if (nextAsset?.product.imageUrl) {
      processedProductImageUrl = buildImageProxyUrl(nextAsset.product.imageUrl, [
        "rs:fit:160:160:1:1",
      ]);
    }

    return {
      session,
      nextPoint,
      nextAsset,
      showSuccessfulInspection,
      inspection,
      processedProductImageUrl,
    };
  }

  return {
    session: null,
    nextPoint: null,
    nextAsset: null,
    showSuccessfulInspection,
    inspection,
    processedProductImageUrl: null,
  };
};

export default function InspectNext({
  loaderData: {
    nextAsset,
    showSuccessfulInspection,
    session,
    inspection,
    processedProductImageUrl,
  },
}: Route.ComponentProps) {
  const { user } = useAuth();
  const canCreateProductRequests = can(user, CAPABILITIES.SUBMIT_REQUESTS);
  const { fetchOrThrow } = useAuthenticatedFetch();

  const { queryKey: suppliesCountQueryKey, queryFn: suppliesCountQueryFn } =
    getSuppliesForProductQuery(fetchOrThrow, inspection?.asset?.productId ?? "");
  const { data: orderableSupplies, isLoading: suppliesCountLoading } = useQuery({
    queryKey: suppliesCountQueryKey,
    queryFn: suppliesCountQueryFn,
    enabled: !!inspection?.asset?.productId,
  });
  const suppliesCount = orderableSupplies?.length ?? 0;

  const { submitJson } = useModalFetcher({
    onSubmitted: () => {
      toast.success("Inspection image attached.");
    },
  });

  const handleAttachInspectionImage = (alertId: string, inspectionImageUrl: string) => {
    submitJson(
      { inspectionImageUrl },
      {
        path: `/api/proxy/alerts/${alertId}/attach-inspection-image`,
      }
    );
  };

  return (
    <div className="grid w-full max-w-md gap-4 self-center">
      {session && <RouteProgressCard activeSession={session} asset={nextAsset ?? undefined} />}
      {showSuccessfulInspection && (
        <Card className="text-center">
          <CardHeader>
            <div className="flex flex-col items-center gap-2">
              <SuccessCircle />
              Inspection successfully submitted!
            </div>
          </CardHeader>
          <CardContent className="grid place-items-center gap-4">
            {!!inspection?.alerts?.length && (
              <div className="grid max-w-md place-items-center gap-4 text-start">
                <Alert variant="warning">
                  <AlertCircle className="size-4" />
                  <AlertTitle>Alerts Triggered</AlertTitle>
                  <AlertDescription>
                    Your inspection has triggered alerts that indicate that this asset may need
                    attention.
                  </AlertDescription>
                </Alert>
                <p className="text-center text-xs">
                  To help in resolving these alerts, please upload a photo, when applicable, for
                  each alert.
                </p>
                <div className="grid w-full gap-2">
                  <h3 className="text-sm font-semibold">Alerts</h3>
                  {inspection.alerts.map((a) => (
                    <div key={a.id} className="grid gap-2 rounded-lg border p-2 text-xs">
                      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 sm:gap-x-8">
                        {[
                          {
                            label: "Question:",
                            value:
                              a.assetQuestionResponse?.assetQuestion?.prompt ?? "Unknown Question",
                          },
                          {
                            label: "Response:",
                            value: (
                              <DisplayInspectionValue
                                value={a.assetQuestionResponse?.value ?? ""}
                              />
                            ),
                          },
                          {
                            label: "Cause:",
                            value: a.message,
                          },
                        ].map(({ label, value }) => (
                          <Fragment key={String(label)}>
                            <dt className="text-muted-foreground text-xs font-semibold">{label}</dt>
                            <dd className="text-xs">{value || <>&mdash;</>}</dd>
                          </Fragment>
                        ))}
                      </dl>
                      <VaultUploadInput
                        buildKey={({ ext }) =>
                          `inspection-alert-${a.id}_${format(
                            new Date(),
                            "yyyy-MM-dd"
                          )}${ext ? `.${ext}` : ""}`
                        }
                        renderAddButtonText={a.inspectionImageUrl ? "Replace Photo" : "Add Photo"}
                        renderAddButtonIcon={a.inspectionImageUrl ? RefreshCw : Plus}
                        accept="image/*"
                        value={a.inspectionImageUrl ?? undefined}
                        onValueChange={(value) => {
                          handleAttachInspectionImage(a.id, value);
                        }}
                      />
                    </div>
                  ))}
                </div>
                <hr className="mt-4 w-full" />
              </div>
            )}
            {inspection?.asset &&
              canCreateProductRequests &&
              (suppliesCountLoading ? (
                <Skeleton className="h-8 w-full" />
              ) : suppliesCount > 0 ? (
                <div className="flex flex-col items-center gap-2">
                  <p className="text-muted-foreground text-sm">
                    Do you need to reorder supplies for this asset?
                  </p>
                  <NewSupplyRequestButton
                    assetId={inspection.asset.id}
                    parentProductId={inspection.asset.productId}
                    onSuccess={() => {
                      toast.success(
                        "Your request was submitted! An FC Safety representative will reach out to your organization shortly.",
                        { duration: 10000 }
                      );
                    }}
                  />
                </div>
              ) : null)}
          </CardContent>
        </Card>
      )}
      {nextAsset ? (
        <Card>
          <CardHeader>
            <CardTitle>Go to Next Asset in Route</CardTitle>
            <CardDescription>
              When you get to the next asset in the route, tap the NFC tag to inspect.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <AssetCard asset={nextAsset} processedProductImageUrl={processedProductImageUrl} />
          </CardContent>
        </Card>
      ) : session ? (
        <Card className="text-center">
          <CardHeader>
            <CardTitle className="justify-center">
              {session.status === "COMPLETE"
                ? "Inspection Route Completed"
                : session.status === "EXPIRED"
                  ? "Inspection Session Expired"
                  : session.status === "CANCELLED"
                    ? "Inspection Session Cancelled"
                    : "Something unexpected happened 🙊"}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 text-sm">
            {session?.status === "COMPLETE" && (
              <p>
                You have completed inspecting all assets in the route. Thank you for your
                inspections!
              </p>
            )}
            <p className="text-muted-foreground text-xs">
              To continue inspecting and/or begin a new route, please scan an asset&apos;s NFC tag.
            </p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
