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
import { format, isAfter } from "date-fns";
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
  getSession,
  inspectionSessionStorage,
  requireUserSession,
} from "~/.server/sessions";
import AssetQuestionResponseTypeInput from "~/components/assets/asset-question-response-input";
import DataList from "~/components/data-list";
import InspectErrorBoundary from "~/components/inspections/inspect-error-boundary";
import ProductCard from "~/components/products/product-card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
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
import { Label } from "~/components/ui/label";
import { Progress } from "~/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";
import type {
  AssetQuestion,
  InspectionRoute,
  InspectionSession,
} from "~/lib/models";
import { buildInspectionSchema, createInspectionSchema } from "~/lib/schema";
import { stringifyQuery, type QueryParams } from "~/lib/urls";
import { can, getUserDisplayName } from "~/lib/users";
import {
  buildTitle,
  cn,
  getSearchParams,
  getValidatedFormDataOrThrow,
  isNil,
} from "~/lib/utils";
import type { Route } from "./+types/index";

export const action = async ({ request }: Route.ActionArgs) => {
  const { data: validatedData } = await getValidatedFormDataOrThrow<
    z.infer<typeof createInspectionSchema>
  >(request, zodResolver(createInspectionSchema));

  const ipAddress = getClientIPAddress(request);

  const qp = getSearchParams(request);
  const inspectionSession = await getSession(request, inspectionSessionStorage);

  // Set active route and session from query params.
  const activeRouteId = qp.get("routeId");
  if (activeRouteId) {
    inspectionSession.set("activeRoute", activeRouteId);
  }
  const activeSessionId = qp.get("sessionId");
  if (activeSessionId) {
    inspectionSession.set("activeSession", activeSessionId);
  }

  // Prepare to pass active route and session to backend via query params.
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
          inspectionSession.set("activeSession", session.id);
        }

        // Update session cookie.
        resolve(
          data(null, {
            headers: {
              "Set-Cookie": await inspectionSessionStorage.commitSession(
                inspectionSession
              ),
            },
          })
        );
      });
    })
    .asRedirect(`next`);
};

export const loader = async ({ request }: Route.LoaderArgs) => {
  await guard(request, (user) => can(user, "create", "inspections"));
  const { user } = await requireUserSession(request);

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
      user,
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
  loaderData: { user, tag, activeSessions, matchingRoutes },
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

  const [routeDisabled, setRouteDisabled] = useState(false);

  const [activeSession, setActiveSession] = useState<
    InspectionSession | undefined | null
  >(
    (() => {
      if (activeSessions) {
        const mySessions = activeSessions.filter(
          (s) => s.lastInspector?.id === user.idpId
        );
        if (mySessions.length === 1) {
          return mySessions[0];
        }
      }
      return undefined;
    })()
  );

  const [activeRoute, setActiveRoute] = useState<
    InspectionRoute | undefined | null
  >(
    matchingRoutes && matchingRoutes.length === 1
      ? matchingRoutes[0]
      : undefined
  );

  const usingRoute = !!activeRoute && !routeDisabled;

  const totalPointsInRoute = activeRoute?.inspectionRoutePoints?.length ?? 0;
  const pointsCompletedInRoute = useMemo(() => {
    if (
      !activeSession?.completedInspectionRoutePoints ||
      !activeRoute?.inspectionRoutePoints
    ) {
      return 0;
    }

    const assetsToComplete = new Set(
      activeRoute.inspectionRoutePoints.map((p) => p.assetId)
    );

    for (const point of activeSession.completedInspectionRoutePoints) {
      if (
        point.inspectionRoutePoint?.assetId &&
        assetsToComplete.has(point.inspectionRoutePoint.assetId)
      ) {
        assetsToComplete.delete(point.inspectionRoutePoint.assetId);
      }
    }

    return activeRoute.inspectionRoutePoints.length - assetsToComplete.size;
  }, [activeSession, activeRoute]);

  const actionQueryParams = useMemo(() => {
    if (routeDisabled) {
      return null;
    }

    if (activeSession) {
      return { sessionId: activeSession.id };
    } else if (activeRoute) {
      return { routeId: activeRoute.id };
    }
    return null;
  }, [activeSession, activeRoute, routeDisabled]);

  return (
    <>
      <div className="grid gap-4">
        <Card className="max-w-lg w-full">
          <CardHeader className="grid gap-4">
            <div className="flex items-center gap-2">
              {usingRoute ? (
                <RouteIcon className="size-5 text-primary" />
              ) : (
                <RouteOff className="size-5 text-muted-foreground" />
              )}
              <div
                className={cn(
                  "text-base font-semibold",
                  usingRoute ? "text-primary" : "text-muted-foreground"
                )}
              >
                {usingRoute ? "Route in Progress" : "No Route"}
              </div>
              <div className="flex-1"></div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setRouteDisabled((prev) => !prev)}
              >
                {routeDisabled ? "Include in Route" : "Exclude from Route"}
              </Button>
            </div>
            <div className="grid gap-2">
              <div className="text-xs font-semibold">Route</div>
              <div className="text-xs text-muted-foreground">
                {!routeDisabled &&
                (!activeSession || !activeRoute) &&
                matchingRoutes &&
                matchingRoutes.length > 0 ? (
                  <Select
                    value={activeRoute?.id}
                    onValueChange={(value) => {
                      const route = matchingRoutes.find(
                        (route) => route.id === value
                      );
                      if (route) {
                        setActiveRoute(route);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a route" />
                    </SelectTrigger>
                    <SelectContent>
                      {matchingRoutes.map((route) => (
                        <SelectItem key={route.id} value={route.id}>
                          {route.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : usingRoute ? (
                  activeRoute.name
                ) : (
                  <span className="italic">
                    {routeDisabled
                      ? "This inspection will not be included in the route."
                      : "No routes available for this asset."}
                  </span>
                )}
              </div>
            </div>
            {usingRoute && (
              <div className="grid gap-2">
                <div className="text-xs font-semibold">
                  Inspections Completed ({pointsCompletedInRoute}/
                  {totalPointsInRoute})
                </div>
                <Progress
                  value={
                    totalPointsInRoute > 0
                      ? (pointsCompletedInRoute / totalPointsInRoute) * 100
                      : 0
                  }
                />
              </div>
            )}
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
                  action={
                    actionQueryParams
                      ? `?index&${stringifyQuery(actionQueryParams)}`
                      : undefined
                  }
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
      <ConfirmSessionPrompt
        open={
          !geolocationPending && activeSession === undefined && !!activeSessions
        }
        activeSessions={activeSessions}
        onContinue={setActiveSession}
        onCancel={() => setActiveSession(null)}
      />
      <AlertDialog
        open={
          !geolocationPending &&
          !routeDisabled &&
          !!activeSession &&
          activeSession.completedInspectionRoutePoints &&
          activeSession.completedInspectionRoutePoints.some(
            (p) => p.inspectionRoutePoint?.assetId === tag.asset?.id
          )
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Inspection Already Completed</AlertDialogTitle>
            <AlertDialogDescription>
              An inspection has already been completed for this asset in the
              current route session.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setRouteDisabled(true);
              }}
            >
              Inspect without route
            </AlertDialogCancel>
            <AlertDialogAction>
              Continue to next asset in route
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function ConfirmSessionPrompt({
  open,
  activeSessions,
  onContinue,
  onCancel,
}: {
  open: boolean;
  activeSessions: InspectionSession[] | null | undefined;
  onContinue: (session: InspectionSession) => void;
  onCancel: () => void;
}) {
  const [selectedSession, setSelectedSession] =
    useState<InspectionSession | null>(
      activeSessions && activeSessions.length === 1 ? activeSessions[0] : null
    );
  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {activeSessions && activeSessions.length > 1
              ? "Which route session would you like to continue?"
              : "Would you like to continue with this session?"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {activeSessions && activeSessions.length > 1
              ? "Multiple route sessions are in progress for this asset. Please select the one you would like to continue.?"
              : "Another inspector has already started inspecting these assets. Would you like to continue with this session?"}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <RadioGroup
          className="grid grid-cols-[auto_auto_auto_1fr]"
          value={selectedSession?.id}
          onValueChange={(sId) =>
            setSelectedSession(
              activeSessions?.find((s) => s.id === sId) ?? null
            )
          }
        >
          {activeSessions?.map((session) => (
            <div
              key={session.id}
              className="grid col-span-full grid-cols-subgrid"
            >
              <RadioGroupItem
                value={session.id}
                className="peer sr-only"
                id={"routeSession" + session.id}
              />
              <Label
                htmlFor={"routeSession" + session.id}
                className="grow h-full grid col-span-full grid-cols-subgrid gap-x-6 rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
              >
                {[
                  {
                    key: "Last updated",
                    value: format(session.modifiedOn, "MMM d, yyyy"),
                  },
                  {
                    key: "Inspector",
                    value: session.lastInspector
                      ? getUserDisplayName(session.lastInspector)
                      : "Unknown",
                  },
                  {
                    key: "Route",
                    value: session.inspectionRoute?.name ?? "Unknown",
                  },
                  {
                    key: "Progress",
                    value: `${
                      session.completedInspectionRoutePoints?.length ?? 0
                    }/${
                      session.inspectionRoute?.inspectionRoutePoints?.length ??
                      0
                    }`,
                  },
                ].map(({ key, value }) => (
                  <div className="grid gap-1 text-xs" key={key}>
                    <div className="text-muted-foreground">{key}</div>
                    <div>{value}</div>
                  </div>
                ))}
              </Label>
            </div>
          ))}
        </RadioGroup>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>
            Continue without existing session
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={!selectedSession}
            onClick={() => selectedSession && onContinue(selectedSession)}
          >
            Continue
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
