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
import { Frown, Nfc } from "lucide-react";
import { isIPv4, isIPv6 } from "net";
import { useEffect, useMemo, useRef, useState } from "react";
import { useFieldArray } from "react-hook-form";
import { Form, isRouteErrorResponse, redirect } from "react-router";
import { useRemixForm } from "remix-hook-form";
import { getClientIPAddress } from "remix-utils/get-client-ip-address";
import type { z } from "zod";
import { api } from "~/.server/api";
import AssetQuestionResponseTypeInput from "~/components/assets/asset-question-response-input";
import DataList from "~/components/data-list";
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
import { Textarea } from "~/components/ui/textarea";
import type { AssetQuestion } from "~/lib/models";
import { buildInspectionSchema, createInspectionSchema } from "~/lib/schema";
import {
  buildTitle,
  getValidatedFormDataOrThrow,
  isNil,
  validateSearchParam,
} from "~/lib/utils";
import type { Route } from "./+types/index";

export const action = async ({ request }: Route.ActionArgs) => {
  const tagNo = validateSearchParam(request, "tagNo");
  const { data } = await getValidatedFormDataOrThrow<
    z.infer<typeof createInspectionSchema>
  >(request, zodResolver(createInspectionSchema));

  const ipAddress = getClientIPAddress(request);

  const { init } = await api.inspections.create(request, {
    ...data,
    useragent: request.headers.get("user-agent") ?? "",
    ipv4: ipAddress && isIPv4(ipAddress) ? ipAddress : undefined,
    ipv6: ipAddress && isIPv6(ipAddress) ? ipAddress : undefined,
  });

  return redirect(`next?tagNo=${tagNo}`, init ?? undefined);
};

export const loader = async ({ request }: Route.LoaderArgs) => {
  const tagNo = validateSearchParam(request, "tagNo");
  const response = await api.tags.getBySerial(request, tagNo);

  if (response.data.asset && !response.data.asset.setupOn) {
    return redirect(`/inspect/setup/?tagNo=${tagNo}`);
  }

  return response;
};

export const meta: Route.MetaFunction = ({ data, matches }) => {
  return [
    {
      title: buildTitle(
        matches,
        data?.asset?.name ?? data?.serialNumber,
        "Inspect"
      ),
    },
  ];
};

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return (
    <Card className="max-w-lg w-full">
      <CardHeader className="text-center">
        <CardTitle className="text-4xl">
          Oops <Frown className="inline size-8" />
        </CardTitle>
        <CardDescription>No asset found.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-2">
        <p className="text-center text-sm">
          Try scanning another tag
          <Nfc className="inline size-4 text-primary" />
        </p>

        {!isNil(error) && isRouteErrorResponse(error) && (
          <p className="mt-6 text-muted-foreground text-sm">
            Error details: {error.data}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

type TForm = z.infer<typeof createInspectionSchema>;

const onlyInspectionQuestions = (questions: AssetQuestion[] | undefined) =>
  (questions ?? []).filter((question) => question.type === "INSPECTION");

export default function InspectIndex({
  loaderData: tag,
}: Route.ComponentProps) {
  const questions = useMemo(
    () =>
      [
        ...onlyInspectionQuestions(tag.asset?.product.assetQuestions),
        ...onlyInspectionQuestions(
          tag.asset?.product.productCategory.assetQuestions
        ),
      ].sort((a, b) => (a.order ?? 0) - (b.order ?? 1)),
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
      longitude: 0,
      latitude: 0,
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
      setValue("latitude", geolocationPosition.coords.latitude);
      setValue("longitude", geolocationPosition.coords.longitude);
      setValue("locationAccuracy", geolocationPosition.coords.accuracy);
      setLocationAlertOpen(false);
    }
  }, [geolocationPosition, setValue]);

  useEffect(() => {
    console.debug("requesting location...");
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setGeolocationPosition(position);
      },
      (error) => {
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

  return (
    <>
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
    </>
  );
}
