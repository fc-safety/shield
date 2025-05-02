import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, isAfter } from "date-fns";
import { Loader2, Nfc } from "lucide-react";
import { isIPv4, isIPv6 } from "net";
import { useEffect, useMemo, useRef, useState } from "react";
import { useFieldArray } from "react-hook-form";
import { Form, redirect, useNavigate } from "react-router";
import { RemixFormProvider, useRemixForm } from "remix-hook-form";
import { getClientIPAddress } from "remix-utils/get-client-ip-address";
import type { z } from "zod";
import { api } from "~/.server/api";
import { catchResponse } from "~/.server/api-utils";
import { guard } from "~/.server/guard";
import {
  fetchActiveInspectionRouteContext,
  validateInspectionSession,
} from "~/.server/inspections";
import { getSession, inspectionSessionStorage } from "~/.server/sessions";
import AssetCard from "~/components/assets/asset-card";
import AssetQuestionResponseTypeInput from "~/components/assets/asset-question-response-input";
import InspectErrorBoundary from "~/components/inspections/inspect-error-boundary";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
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
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { Textarea } from "~/components/ui/textarea";
import { useAuth } from "~/contexts/auth-context";
import { getValidatedFormDataOrThrow } from "~/lib/forms";
import type {
  Asset,
  AssetQuestion,
  InspectionRoute,
  InspectionSession,
  Tag,
} from "~/lib/models";
import { buildInspectionSchema, createInspectionSchema } from "~/lib/schema";
import { stringifyQuery, type QueryParams } from "~/lib/urls";
import { can, getUserDisplayName } from "~/lib/users";
import { buildTitle, getSearchParams, isNil } from "~/lib/utils";
import RouteProgressCard from "~/routes/inspect/components/route-progress-card";
import type { Route } from "./+types/index";
import { INSPECTION_TOKEN_HEADER } from "./constants/headers";

export const action = async ({ request }: Route.ActionArgs) => {
  const { data: validatedData } = await getValidatedFormDataOrThrow<
    z.infer<typeof createInspectionSchema>
  >(request, zodResolver(createInspectionSchema));

  const ipAddress = getClientIPAddress(request);

  const qp = getSearchParams(request);
  const inspectionSession = await getSession(request, inspectionSessionStorage);

  const inspectionToken = inspectionSession.get("inspectionToken");

  // Set active route and session from query params.
  const activeRouteId = qp.get("routeId");
  if (activeRouteId) {
    inspectionSession.set("activeRoute", activeRouteId);
  } else {
    inspectionSession.unset("activeRoute");
  }
  const activeSessionId = qp.get("sessionId");
  if (activeSessionId) {
    inspectionSession.set("activeSession", activeSessionId);
  } else {
    inspectionSession.unset("activeSession");
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
        headers: {
          [INSPECTION_TOKEN_HEADER]: inspectionToken ?? "",
        },
      }
    )
    .then(async ({ inspection, session }) => {
      // If session object is returned, make sure to store it for later use.
      if (session) {
        inspectionSession.set("activeSession", session.id);
      }

      return { inspection };
    })
    .then(async (data) =>
      redirect(`next?success&inspectionId=${data.inspection.id}`, {
        headers: {
          "Set-Cookie": await inspectionSessionStorage.commitSession(
            inspectionSession
          ),
        },
      })
    );
};

export const loader = async ({ request }: Route.LoaderArgs) => {
  // TODO: Redirect based on user access.
  // [✅] PUBLIC: View public inspection history.
  // [✅] INSPECTOR: Begin inspection.
  // [  ] MANAGER: View menu: Inspect, History, Order Supplies, etc.
  await guard(request, (user) => can(user, "create", "inspections"));

  const { tagExternalId } = await validateInspectionSession(request);

  const {
    data: { data: tag },
  } = await catchResponse(api.tags.getForInspection(request, tagExternalId), {
    codes: [404],
  });

  // If tag isn't found, it means it hasn't been registered yet.
  // Redirect to registration page, which will handle completing tag
  // setup.
  if (!tag || !tag.asset) {
    throw redirect("/inspect/register/");
  }

  // If asset hasn't been setup yet, redirect to setup page.
  if (!tag.asset.setupOn) {
    return redirect("/inspect/setup/");
  }

  const qp = getSearchParams(request);
  const action = qp.get("action");
  const sessionId = qp.get("sessionId");

  // Load inspection route and session data, if present.
  return fetchActiveInspectionRouteContext(request, tag.asset.id, {
    sessionId: sessionId ?? undefined,
    resetSession: action === "reset-session",
  }).then((result) => ({
    tag,
    ...result,
  }));
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
  loaderData: { tag, activeOrRecentlyExpiredSessions, matchingRoutes },
}: Route.ComponentProps) {
  if (tag.asset) {
    return (
      <InspectionPage
        tag={tag}
        asset={tag.asset}
        activeOrRecentlyExpiredSessions={activeOrRecentlyExpiredSessions}
        matchingRoutes={matchingRoutes}
      />
    );
  }

  return (
    <Alert variant="warning">
      <AlertTitle>
        Oops! This tag hasn&apos;t been registered correctly.
      </AlertTitle>
      <AlertDescription>
        Please contact your administrator to ensure this tag is assigned to an
        asset.
      </AlertDescription>
    </Alert>
  );
}

function InspectionPage({
  tag,
  asset,
  activeOrRecentlyExpiredSessions,
  matchingRoutes,
}: {
  tag: Tag;
  asset: NonNullable<Tag["asset"]>;
  activeOrRecentlyExpiredSessions: InspectionSession[] | null | undefined;
  matchingRoutes: InspectionRoute[] | null | undefined;
}) {
  const questions = useMemo(
    () =>
      [
        ...onlyInspectionQuestions(asset.product.assetQuestions),
        ...onlyInspectionQuestions(
          asset.product.productCategory.assetQuestions
        ),
      ].sort((a, b) => {
        if (!isNil(a.order) && !isNil(b.order) && a.order !== b.order) {
          return a.order - b.order;
        }
        if (a.order) return -1;
        if (b.order) return 1;
        return isAfter(a.createdOn, b.createdOn) ? 1 : -1;
      }),
    [asset]
  );

  const narrowedCreateInspectionSchema = useMemo(() => {
    return buildInspectionSchema(questions);
  }, [questions]);

  const form = useRemixForm<TForm>({
    resolver: zodResolver(narrowedCreateInspectionSchema as z.Schema<TForm>),
    values: {
      asset: {
        connect: {
          id: asset.id,
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
  const locationAlertTimeout = useRef<number | undefined>(undefined);
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

  const [actionQueryParams, setActionQueryParams] =
    useState<QueryParams | null>(null);

  return (
    <>
      <div className="grid gap-4 max-w-md self-center">
        <InspectionRouteCard
          activeOrRecentlyExpiredSessions={activeOrRecentlyExpiredSessions}
          matchingRoutes={matchingRoutes}
          asset={asset}
          userInteractionReady={!geolocationPending}
          setActionQueryParams={setActionQueryParams}
        />
        <AssetCard
          asset={{
            ...asset,
            tag,
          }}
        />
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Inspecting &quot;{asset.name}&quot;
              <Nfc className="size-8 text-primary" />
            </CardTitle>
            <CardDescription>
              Please answer the following questions to complete the inspection.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6 sm:gap-8">
            <RemixFormProvider {...form}>
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
            </RemixFormProvider>
          </CardContent>
        </Card>
      </div>
      <AlertDialog open={locationAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Location Required</AlertDialogTitle>
          </AlertDialogHeader>
          <p className="text-sm text-muted-foreground">
            To continue, your device location must be enabled for this page.
            <br />
            <br />
            <span className="inline-block font-bold italic mb-2">
              What if I don&apos;t see a prompt to enable my location?
            </span>
            <br />
            <ol className="list-decimal list-inside">
              <li>
                Ensure that location services are enabled for this browser in
                your device&apos;s browser or system settings.
              </li>
              <li>
                <button
                  onClick={() => {
                    window.location.reload();
                  }}
                  className="underline"
                >
                  Refresh this page.
                </button>
              </li>
            </ol>
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

function InspectionRouteCard({
  activeOrRecentlyExpiredSessions,
  matchingRoutes,
  asset,
  userInteractionReady,
  setActionQueryParams,
}: {
  activeOrRecentlyExpiredSessions: InspectionSession[] | null | undefined;
  matchingRoutes: InspectionRoute[] | null | undefined;
  asset: Asset | undefined;
  userInteractionReady: boolean;
  setActionQueryParams: (params: QueryParams | null) => void;
}) {
  const { user } = useAuth();

  const activeSessions = useMemo(() => {
    return activeOrRecentlyExpiredSessions?.filter(
      (s) => s.status === "PENDING"
    );
  }, [activeOrRecentlyExpiredSessions]);

  // Allow user to disable route for this inspection.
  const [routeDisabled, setRouteDisabled] = useState(false);

  const [activeSession, setActiveSession] = useState<
    InspectionSession | undefined | null
  >();

  // Automatically set active session based on user's last session. If the user
  // has multiple sessions, or if another inspector has already started a session,
  // the user will be prompted to confirm which session they would like to continue.
  useEffect(() => {
    if (activeOrRecentlyExpiredSessions) {
      const mySessions = activeOrRecentlyExpiredSessions.filter(
        (s) => s.lastInspector?.idpId === user.idpId
      );
      const myActiveSessions = mySessions.filter((s) => s.status === "PENDING");

      if (myActiveSessions.length === 1) {
        // Choose active session if there is only one.
        setActiveSession(myActiveSessions[0]);
      } else if (mySessions.length === 1) {
        // Choose any session if there is only one.
        setActiveSession(mySessions[0]);
      }
    }
  }, [user, activeOrRecentlyExpiredSessions]);

  const [activeRoute, setActiveRoute] = useState<
    InspectionRoute | undefined | null
  >();

  // Similar to the active session, automatically set the active route if there is only
  // one route for the asset. Otherwise, the user must select the route they would like
  // to use.
  useEffect(() => {
    if (matchingRoutes && matchingRoutes.length === 1) {
      setActiveRoute(matchingRoutes[0]);
    }
  }, [matchingRoutes]);

  // In order to communicate to the backend which route and session are in use, set query
  // params used in the form submission action.
  useEffect(() => {
    if (!routeDisabled) {
      if (activeSession) {
        setActionQueryParams({ sessionId: activeSession.id });
        return;
      }

      if (activeRoute) {
        setActionQueryParams({ routeId: activeRoute.id });
        return;
      }
    }
    setActionQueryParams(null);
  }, [activeSession, activeRoute, routeDisabled, setActionQueryParams]);

  return (
    <>
      <RouteProgressCard
        activeRoute={activeRoute}
        setActiveRoute={setActiveRoute}
        activeSession={activeSession}
        matchingRoutes={matchingRoutes}
        routeDisabled={routeDisabled}
        setRouteDisabled={setRouteDisabled}
        asset={asset}
      />
      {/* Show confirm session prompt if there are multiple (non-expired) sessions. */}
      {activeSessions && (
        <ConfirmSessionPrompt
          open={
            userInteractionReady &&
            activeSession === undefined &&
            activeSessions.length > 0
          }
          activeSessions={activeSessions}
          onContinue={setActiveSession}
          onCancel={() => setActiveSession(null)}
        />
      )}
      {/* Show alert if there is a single active session and the current asset has
       * already been inspected in the current session. */}
      {activeSession && (
        <InspectionForAssetCompletedAlert
          open={
            userInteractionReady &&
            !routeDisabled &&
            !!activeSession.completedInspectionRoutePoints &&
            activeSession.completedInspectionRoutePoints.some(
              (p) => p.inspectionRoutePoint?.assetId === asset?.id
            )
          }
          activeSession={activeSession}
          setRouteDisabled={setRouteDisabled}
        />
      )}
      {activeSession && activeSession.status === "EXPIRED" && (
        <SessionExpiredAlert
          open={userInteractionReady && activeSession.status === "EXPIRED"}
          onContinue={() => setActiveSession(null)}
          onContinueWithoutRoute={() => {
            setActiveSession(null);
            setRouteDisabled(true);
          }}
        />
      )}
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
  activeSessions: InspectionSession[];
  onContinue: (session: InspectionSession) => void;
  onCancel: () => void;
}) {
  const [selectedSession, setSelectedSession] =
    useState<InspectionSession | null>(
      activeSessions.length === 1 ? activeSessions[0] : null
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

function InspectionForAssetCompletedAlert({
  open,
  activeSession,
  setRouteDisabled,
}: {
  open: boolean;
  activeSession: InspectionSession;
  setRouteDisabled: (disabled: boolean) => void;
}) {
  const navigate = useNavigate();

  return (
    <AlertDialog open={open}>
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
          <AlertDialogAction
            onClick={() => navigate("next?sessionId=" + activeSession.id)}
          >
            Continue to next asset in route
          </AlertDialogAction>
        </AlertDialogFooter>
        <Button
          variant="link"
          onClick={() => {
            navigate(
              "/inspect?action=reset-session&sessionId=" + activeSession.id
            );
          }}
        >
          or cancel current session and restart route
        </Button>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function SessionExpiredAlert({
  open,
  onContinue,
  onContinueWithoutRoute,
}: {
  open: boolean;
  onContinue: () => void;
  onContinueWithoutRoute: () => void;
}) {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Session Expired</AlertDialogTitle>
          <AlertDialogDescription>
            This route session has expired. Please start a new session to
            continue.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            onClick={() => {
              onContinueWithoutRoute();
            }}
          >
            Inspect without route
          </AlertDialogCancel>
          <AlertDialogAction onClick={() => onContinue()}>
            Start new route session
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
