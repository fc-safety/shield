import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Form as FormProvider,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { isAfter } from "date-fns";
import { Loader2, Nfc, Route as RouteIcon, RouteOff } from "lucide-react";
import { isIPv4, isIPv6 } from "net";
import { useEffect, useMemo, useRef, useState } from "react";
import { useFieldArray } from "react-hook-form";
import { data, Form, redirect } from "react-router";
import { useRemixForm } from "remix-hook-form";
import { getClientIPAddress } from "remix-utils/get-client-ip-address";
import type { z } from "zod";
import { api } from "~/.server/api";
import { DataResponse, mergeInit } from "~/.server/api-utils";
import { guard } from "~/.server/guard";
import { validateTagId } from "~/.server/inspections";
import {
  getSessionValues,
  inspectionSessionStorage,
  setAndCommitSession,
} from "~/.server/sessions";
import AssetQuestionResponseTypeInput from "~/components/assets/asset-question-response-input";
import DataList from "~/components/data-list";
import InspectErrorBoundary from "~/components/inspections/inspect-error-boundary";
import ProductCard from "~/components/products/product-card";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Progress } from "~/components/ui/progress";
import { Textarea } from "~/components/ui/textarea";
import type {
  AssetQuestion,
  InspectionRoute,
  InspectionSession,
} from "~/lib/models";
import { buildInspectionSchema, createInspectionSchema } from "~/lib/schema";
import type { QueryParams } from "~/lib/urls";
import { can } from "~/lib/users";
import { buildTitle, getValidatedFormDataOrThrow, isNil } from "~/lib/utils";
import type { Route } from "./+types/index";

export const action = async ({ request }: Route.ActionArgs) => {
  const { data: validatedData } = await getValidatedFormDataOrThrow<
    z.infer<typeof createInspectionSchema>
  >(request, zodResolver(createInspectionSchema));

  const ipAddress = getClientIPAddress(request);

  const [activeSessionId, activeRouteId] = await getSessionValues(
    request,
    inspectionSessionStorage,
    ["activeSession", "activeRoute"]
  );

  const queryParams: QueryParams = {};
  if (activeSessionId) {
    queryParams.sessionId = activeSessionId;
  }
  if (!activeSessionId && activeRouteId) {
    queryParams.routeId = activeRouteId;
  }

  return api.inspections
    .create(
      request,
      {
        ...validatedData,
        useragent: request.headers.get("user-agent") ?? "",
        ipv4: ipAddress && isIPv4(ipAddress) ? ipAddress : undefined,
        ipv6: ipAddress && isIPv6(ipAddress) ? ipAddress : undefined,
      },
      {
        params: queryParams,
      }
    )
    .mapWith(({ session }) => {
      return new DataResponse(async (resolve) => {
        // If session object is returned, make sure to store it for later use.
        if (session) {
          resolve(
            data(null, {
              headers: {
                "Set-Cookie": await setAndCommitSession(
                  request,
                  inspectionSessionStorage,
                  "activeSession",
                  session.id
                ),
              },
            })
          );
        } else {
          // Otherwise, just return a null response.
          resolve(data(null));
        }
      });
    })
    .asRedirect(`next`);
};

export const loader = async ({ request }: Route.LoaderArgs) => {
  await guard(request, (user) => can(user, "create", "inspections"));

  const extId = await validateTagId(request, "/inspect");

  const response = await api.tags.getByExternalId(request, extId);
  let init = response.init;

  if (response.data.asset && !response.data.asset.setupOn) {
    return redirect(
      `/inspect/setup/?extId=${extId}`,
      response.init ?? undefined
    );
  }

  let activeSessions: InspectionSession[] | null = null;
  let matchingRoutes: InspectionRoute[] | null = null;
  if (response.data.asset) {
    const { data: _activeSessions, init: thisInit } =
      await api.inspections.getActiveSessionsForAsset(
        request,
        response.data.asset.id
      );
    activeSessions = _activeSessions;
    init = mergeInit(init, thisInit);

    if (activeSessions.length === 0) {
      const { data: _matchingRoutes, init: thisInit } =
        await api.inspectionRoutes.getForAssetId(
          request,
          response.data.asset.id
        );
      matchingRoutes = _matchingRoutes;
      init = mergeInit(init, thisInit);
    } else {
      matchingRoutes = activeSessions
        .map((session) => session.inspectionRoute)
        .filter((r): r is InspectionRoute => !!r);
    }
  }

  return data(
    {
      tag: response.data,
      activeSessions,
      matchingRoutes,
    },
    init ?? undefined
  );
};

export const meta: Route.MetaFunction = ({ data, matches }) => {
  return [
    {
      title: buildTitle(
        matches,
        data?.tag?.asset?.name ?? data?.tag?.serialNumber,
        "Inspect"
      ),
    },
  ];
};

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <InspectErrorBoundary error={error} />;
}

type TForm = z.infer<typeof createInspectionSchema>;

const onlyInspectionQuestions = (questions: AssetQuestion[] | undefined) =>
  (questions ?? []).filter((question) => question.type === "INSPECTION");

export default function InspectIndex({
  loaderData: { tag, activeSessions, matchingRoutes },
}: Route.ComponentProps) {
  const questions = useMemo(
    () =>
      [
        ...onlyInspectionQuestions(tag.asset?.product.assetQuestions),
        ...onlyInspectionQuestions(
          tag.asset?.product.productCategory.assetQuestions
        ),
      ].sort((a, b) => {
        if (!isNil(a.order) && !isNil(b.order) && a.order !== b.order) {
          return a.order - b.order;
        }
        if (a.order) return -1;
        if (b.order) return 1;
        return isAfter(a.createdOn, b.createdOn) ? 1 : -1;
      }),
    [tag]
  );

  const narrowedCreateInspectionSchema = useMemo(() => {
    return buildInspectionSchema(questions);
  }, [questions]);

  const form = useRemixForm<TForm>({
    resolver: zodResolver(narrowedCreateInspectionSchema),
    values: {
      asset: {
        connect: {
          id: tag.asset?.id ?? "",
        },
      },
      status: "COMPLETE",
      responses: {
        createMany: {
          data: questions.map((question) => ({
            assetQuestionId: question.id,
            value: "",
          })),
        },
      },
      longitude: -999,
      latitude: -999,
      comments: "",
    } satisfies TForm,
    mode: "onBlur",
  });

  const {
    formState: { isValid, isSubmitting },
    setValue,
  } = form;

  const { fields: questionFields } = useFieldArray({
    control: form.control,
    name: "responses.createMany.data",
  });

  const [locationAlertOpen, setLocationAlertOpen] = useState(false);
  const locationAlertTimeout = useRef<number | undefined>();
  const [geolocationPending, setGeolocationPending] = useState(true);
  const [geolocationPosition, setGeolocationPosition] = useState<
    GeolocationPosition | undefined
  >();

  useEffect(() => {
    if (geolocationPosition === undefined) {
      if (!locationAlertTimeout.current) {
        locationAlertTimeout.current = window.setTimeout(() => {
          setLocationAlertOpen(true);
        }, 2000);
      }
    } else {
      if (locationAlertTimeout.current) {
        clearTimeout(locationAlertTimeout.current);
      }
      setValue("latitude", geolocationPosition.coords.latitude, {
        shouldValidate: true,
      });
      setValue("longitude", geolocationPosition.coords.longitude, {
        shouldValidate: true,
      });
      setValue("locationAccuracy", geolocationPosition.coords.accuracy, {
        shouldValidate: true,
      });
      setLocationAlertOpen(false);
    }
  }, [geolocationPosition, setValue]);

  useEffect(() => {
    console.debug("requesting location...");
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setGeolocationPosition(position);
        setGeolocationPending(false);
      },
      (error) => {
        setGeolocationPending(false);
        if (error.code === error.POSITION_UNAVAILABLE) {
          console.error(error);
        }

        if (error.code === error.PERMISSION_DENIED) {
          setLocationAlertOpen(true);
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 7000,
        maximumAge: 3000,
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const [activeSession, setActiveSession] = useState<InspectionSession | null>(
    activeSessions && activeSessions.length === 1 ? activeSessions[0] : null
  );

  const [activeRoute, setActiveRoute] = useState<InspectionRoute | null>(
    matchingRoutes && matchingRoutes.length === 1 ? matchingRoutes[0] : null
  );

  return (
    <>
      <div className="grid gap-4">
        <Card className="max-w-lg w-full">
          <CardHeader className="grid gap-4">
            <div className="flex items-center justify-between">
              <div className="grid gap-1">
                <div className="text-sm font-semibold">Active Route</div>
                <div className="text-xs text-muted-foreground">
                  {activeRoute?.name ?? (
                    <span className="italic">
                      {!matchingRoutes || matchingRoutes.length === 0
                        ? "No routes available for this asset."
                        : "No route selected."}
                    </span>
                  )}
                </div>
              </div>
              <div>
                {activeRoute ? (
                  <RouteIcon className="size-5 text-primary" />
                ) : (
                  <RouteOff className="size-5 text-muted-foreground" />
                )}
              </div>
            </div>
            <div className="grid gap-2">
              <div className="text-sm font-semibold">Progress</div>
              <Progress value={activeRoute ? 25 : 0} />
            </div>
          </CardHeader>
        </Card>
        <Card className="max-w-lg w-full">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center justify-between">
              Asset Inspection
              <Nfc className="size-8 text-primary" />
            </CardTitle>
            <CardDescription>Tag Serial No. {tag.serialNumber}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6 sm:gap-8">
            {tag.asset ? (
              <div>
                <div className="mb-2 text-sm font-bold">Details</div>
                <DataList
                  details={[
                    {
                      label: "Name",
                      value: tag.asset.name,
                    },
                    {
                      label: "Serial No.",
                      value: tag.asset.serialNumber,
                    },
                    {
                      label: "Location",
                      value: tag.asset.location,
                    },
                    {
                      label: "Placement",
                      value: tag.asset.placement,
                    },
                  ]}
                />
              </div>
            ) : (
              <p>No asset assigned to this tag.</p>
            )}
            {tag.asset?.product && (
              <div>
                <div className="mb-2 text-sm font-bold">Product</div>
                <ProductCard
                  product={tag.asset.product}
                  displayActiveIndicator={false}
                />
              </div>
            )}

            {tag.asset && (
              <FormProvider {...form}>
                <Form
                  className="space-y-4"
                  method={"post"}
                  onSubmit={form.handleSubmit}
                >
                  <Input
                    type="hidden"
                    {...form.register("asset.connect.id")}
                    hidden
                  />
                  {questionFields.map((questionField, index) => {
                    const question = questions[index];
                    return (
                      <FormField
                        key={questionField.id}
                        control={form.control}
                        name={`responses.createMany.data.${index}.value`}
                        render={({ field: { value, onChange, onBlur } }) => (
                          <FormItem>
                            <FormLabel>{question?.prompt}</FormLabel>
                            <FormControl>
                              <AssetQuestionResponseTypeInput
                                value={value ?? ""}
                                onValueChange={onChange}
                                onBlur={onBlur}
                                valueType={question?.valueType ?? "BINARY"}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    );
                  })}
                  {questionFields.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center">
                      No questions available for this asset. Please contact your
                      administrator.
                      <br />
                      <br />
                      You can still leave comments and submit the inspection.
                    </p>
                  )}
                  <FormField
                    control={form.control}
                    name="comments"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional comments</FormLabel>
                        <FormControl>
                          <Textarea {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    disabled={!!isSubmitting || !isValid}
                    className="w-full"
                  >
                    {isSubmitting ? "Sending data..." : "Complete Inspection"}
                  </Button>
                </Form>
              </FormProvider>
            )}
          </CardContent>
        </Card>
      </div>
      <AlertDialog open={locationAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Enable Location</AlertDialogTitle>
          </AlertDialogHeader>
          <p className="text-sm text-muted-foreground">
            Information about your location is required before you can continue
            completing the inspection.
            <br />
            <br />
            If you can no longer see the prompt to enable location, please
            refresh the page.
          </p>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={geolocationPending}>
        <AlertDialogContent className="flex items-center justify-center size-32">
          <AlertDialogHeader>
            <AlertDialogTitle></AlertDialogTitle>
            <Loader2 className="size-8 animate-spin" />
          </AlertDialogHeader>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
