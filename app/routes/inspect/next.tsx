import { format } from "date-fns";
import { AlertCircle, Plus, RefreshCw } from "lucide-react";
import { redirect } from "react-router";
import { Fragment } from "react/jsx-runtime";
import { toast } from "sonner";
import { api } from "~/.server/api";
import { getNextPointFromSession } from "~/.server/inspections";
import {
  getSession,
  getSessionValue,
  inspectionSessionStorage,
} from "~/.server/sessions";
import DisplayInspectionValue from "~/components/assets/display-inspection-value";
import { NewSupplyRequestButton } from "~/components/assets/product-requests";
import DataList from "~/components/data-list";
import RouteProgressCard from "~/components/inspections/route-progress-card";
import ProductCard from "~/components/products/product-card";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import VaultUploadInput from "~/components/vault-upload-input";
import { useAuth } from "~/contexts/auth-context";
import { useModalFetcher } from "~/hooks/use-modal-fetcher";
import type { Asset, Inspection } from "~/lib/models";
import { can } from "~/lib/users";
import { getSearchParam } from "~/lib/utils";
import type { Route } from "./+types/next";
import SuccessCircle from "./components/success-circle";

export const loader = async ({ request }: Route.LoaderArgs) => {
  const inspectionId = getSearchParam(request, "inspectionId");
  const success = getSearchParam(request, "success");
  const showSuccessfulInspection = success !== null;

  let activeSessionId: string | null | undefined = getSearchParam(
    request,
    "sessionId"
  );
  const inspectionSession = await getSession(request, inspectionSessionStorage);

  if (activeSessionId) {
    inspectionSession.set("activeSession", activeSessionId);
    throw redirect(".", {
      headers: {
        "Set-Cookie": await inspectionSessionStorage.commitSession(
          inspectionSession
        ),
      },
    });
  }

  activeSessionId = await getSessionValue(
    request,
    inspectionSessionStorage,
    "activeSession"
  );

  let inspection: Inspection | null = null;
  if (inspectionId) {
    inspection = await api.inspections.get(request, inspectionId);
  }

  if (activeSessionId) {
    const { session, nextPoint, routeCompleted } = await api.inspections
      .getSession(request, activeSessionId)
      .then((session) => ({
        session,
        ...getNextPointFromSession(session),
      }));

    let nextAsset: Asset | null = null;
    if (nextPoint) {
      nextAsset = await api.assets.get(request, nextPoint.assetId);
    } else if (routeCompleted) {
      await api.inspections.completeSession(request, session.id);
    }

    return {
      session,
      nextPoint,
      nextAsset,
      routeCompleted,
      showSuccessfulInspection,
      inspection,
    };
  }

  return {
    session: null,
    nextPoint: null,
    nextAsset: null,
    routeCompleted: false,
    showSuccessfulInspection,
    inspection,
  };
};

export default function InspectNext({
  loaderData: {
    nextAsset,
    routeCompleted,
    showSuccessfulInspection,
    session,
    inspection,
  },
}: Route.ComponentProps) {
  const { user } = useAuth();
  const canCreateProductRequests = can(user, "create", "product-requests");

  const { submitJson } = useModalFetcher({
    onSubmitted: () => {
      toast.success("Inspection image attached.");
    },
  });

  const handleAttachInspectionImage = (
    alertId: string,
    inspectionImageUrl: string
  ) => {
    submitJson(
      { inspectionImageUrl },
      {
        path: `/api/proxy/alerts/${alertId}/attach-inspection-image`,
      }
    );
  };

  return (
    <div className="grid gap-4">
      {session && <RouteProgressCard activeSession={session} />}
      {showSuccessfulInspection && (
        <Card className="text-center">
          <CardHeader>
            <div className="flex flex-col items-center gap-2">
              <SuccessCircle />
              Inspection successfully submitted!
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 place-items-center">
            {!!inspection?.alerts?.length && (
              <div className="grid gap-4 place-items-center text-start max-w-md">
                <Alert variant="warning">
                  <AlertCircle className="size-4" />
                  <AlertTitle>Alerts Triggered</AlertTitle>
                  <AlertDescription>
                    Your inspection has triggered alerts that indicate that this
                    asset may need attention.
                  </AlertDescription>
                </Alert>
                <p className="text-xs text-center">
                  To help in resolving these alerts, please upload a photo, when
                  applicable, for each alert.
                </p>
                <div className="grid gap-2 w-full">
                  <h3 className="text-sm font-semibold">Alerts</h3>
                  {inspection.alerts.map((a) => (
                    <div
                      key={a.id}
                      className="grid gap-2 text-xs border rounded-lg p-2"
                    >
                      <dl className="grid gap-y-1 gap-x-4 sm:gap-x-8 grid-cols-[auto_1fr]">
                        {[
                          {
                            label: "Question:",
                            value:
                              a.assetQuestionResponse?.assetQuestion?.prompt ??
                              "Unknown Question",
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
                            <dt className="font-semibold text-muted-foreground text-xs">
                              {label}
                            </dt>
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
                        renderAddButtonText={
                          a.inspectionImageUrl ? "Replace Photo" : "Add Photo"
                        }
                        renderAddButtonIcon={
                          a.inspectionImageUrl ? RefreshCw : Plus
                        }
                        accept="image/*"
                        value={a.inspectionImageUrl ?? undefined}
                        onValueChange={(value) => {
                          handleAttachInspectionImage(a.id, value);
                        }}
                      />
                    </div>
                  ))}
                </div>
                <hr className="w-full mt-4" />
              </div>
            )}
            {inspection?.asset && canCreateProductRequests && (
              <div className="flex flex-col gap-2 items-center">
                <p className="text-sm text-muted-foreground">
                  Do you need to reorder supplies for this asset?
                </p>
                <NewSupplyRequestButton
                  assetId={inspection.asset.id}
                  parentProductId={inspection.asset.productId}
                  productCategoryId={inspection.asset.product.productCategoryId}
                  onSuccess={() => {
                    toast.success("Product request submitted.");
                  }}
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}
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
