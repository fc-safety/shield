import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { parseISO } from "date-fns";
import { AlertCircle, ArrowRight, Plus } from "lucide-react";
import { useMemo } from "react";
import { useFieldArray } from "react-hook-form";
import { Form, Link } from "react-router";
import { RemixFormProvider, useRemixForm } from "remix-hook-form";
import type { z } from "zod";
import { api } from "~/.server/api";
import { guard } from "~/.server/guard";
import { buildImageProxyUrl } from "~/.server/images";
import {
  fetchActiveInspectionRouteContext,
  validateInspectionSession,
} from "~/.server/inspections";
import AssetCard from "~/components/assets/asset-card";
import AssetQuestionFilesDisplay from "~/components/assets/asset-question-files-display";
import AssetQuestionRegulatoryCodesDisplay from "~/components/assets/asset-question-regulatory-codes-display";
import AssetQuestionResponseTypeInput from "~/components/assets/asset-question-response-input";
import EditRoutePointButton from "~/components/inspections/edit-route-point-button";
import InspectErrorBoundary from "~/components/inspections/inspect-error-boundary";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { useAuth } from "~/contexts/auth-context";
import { ASSET_QUESTION_TONES } from "~/lib/constants";
import { getValidatedFormDataOrThrow } from "~/lib/forms";
import { buildSetupAssetSchema, setupAssetSchema } from "~/lib/schema";
import { can } from "~/lib/users";
import { buildTitle, cn, isNil } from "~/lib/utils";
import type { Route } from "./+types/setup";

export const action = async ({ request }: Route.ActionArgs) => {
  const { data } = await getValidatedFormDataOrThrow(request, zodResolver(setupAssetSchema));

  if (data.setupOn) {
    return api.assets.updateSetup(request, data as z.infer<typeof setupAssetSchema>);
  } else {
    return api.assets.setup(request, data as z.infer<typeof setupAssetSchema>);
  }
};

export const loader = async ({ request }: Route.LoaderArgs) => {
  const { tagExternalId } = await validateInspectionSession(request);

  await guard(request, (user) => can(user, "setup", "assets"));

  const tag = await api.tags.getForAssetSetup(request, tagExternalId);

  if (tag.asset?.id) {
    const [routeContext, setupQuestions] = await Promise.all([
      fetchActiveInspectionRouteContext(request, tag.asset.id),
      api.assetQuestions.findByAsset(request, tag.asset.id, "SETUP"),
    ]);

    return {
      tag: tag,
      ...routeContext,
      setupQuestions,
      processedProductImageUrl:
        tag.asset?.product.imageUrl &&
        buildImageProxyUrl(tag.asset.product.imageUrl, ["rs:fit:160:160:1:1"]),
    };
  }

  return {
    tag,
    activeSessions: null,
    matchingRoutes: null,
    setupQuestions: [],
    processedProductImageUrl: null,
  };
};

export const meta: Route.MetaFunction = ({ data, matches }) => {
  return [
    {
      title: buildTitle(matches, data?.tag.asset?.name ?? data?.tag.serialNumber, "Setup"),
    },
  ];
};

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <InspectErrorBoundary error={error} />;
}

type TForm = z.infer<typeof setupAssetSchema>;

export default function InspectSetup({
  loaderData: { tag, matchingRoutes, setupQuestions, processedProductImageUrl },
}: Route.ComponentProps) {
  const isSetup = !!tag.asset?.setupOn;

  const { user } = useAuth();
  const canUpdateInspectionRoutes = can(user, "update", "inspection-routes");

  const showRouteCard =
    (!!matchingRoutes && matchingRoutes.length > 0) || canUpdateInspectionRoutes;

  const questions = useMemo(
    () => setupQuestions.sort((a, b) => (a.order ?? 0) - (b.order ?? 1)),
    [setupQuestions]
  );

  const narrowedSetupAssetSchema = useMemo(() => {
    return buildSetupAssetSchema(questions, tag.asset?.setupQuestionResponses ?? []);
  }, [questions, tag]);

  const form = useRemixForm({
    resolver: zodResolver(narrowedSetupAssetSchema),
    values: {
      id: tag.asset?.id ?? "",
      setupOn: tag.asset?.setupOn ? parseISO(tag.asset.setupOn) : undefined,
      setupQuestionResponses: isSetup
        ? questions.reduce(
            (acc, question) => {
              const response = tag.asset?.setupQuestionResponses?.find(
                (response) => response.assetQuestionId === question.id
              );

              if (response) {
                acc.updateMany.push({
                  where: { id: response.id },
                  data: response,
                });
              } else {
                acc.createMany.data.push({
                  value: "",
                  assetQuestionId: question.id,
                });
              }

              return acc;
            },
            {
              createMany: {
                data: [],
              },
              updateMany: [],
            } as TForm["setupQuestionResponses"]
          )
        : {
            createMany: {
              data: questions.map((question) => ({
                value: "",
                assetQuestionId: question.id,
              })),
            },
            updateMany: [],
          },
    } satisfies TForm,
  });

  const {
    formState: { isDirty, isValid, isSubmitting },
  } = form;

  const { fields: createQuestionFields } = useFieldArray({
    control: form.control,
    name: "setupQuestionResponses.createMany.data",
  });

  const { fields: updateQuestionFields } = useFieldArray({
    control: form.control,
    name: "setupQuestionResponses.updateMany",
  });

  const allQuestionFields = useMemo(() => {
    return [
      ...updateQuestionFields.map(({ id, data }) => ({
        key: id,
        data,
      })),
      ...createQuestionFields.map(({ id, ...qf }) => ({
        key: id,
        data: {
          id: undefined,
          ...qf,
        },
      })),
    ];
  }, [createQuestionFields, updateQuestionFields]);

  return (
    <>
      <div className="grid max-w-md gap-4 self-center">
        {showRouteCard && (
          <Card>
            <CardHeader>
              <CardTitle>Route Information</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-2">
              {matchingRoutes?.length ? (
                <div className="text-sm">
                  <div className="mb-2">
                    This asset is currently part of {matchingRoutes.length} route
                    {matchingRoutes.length === 1 ? "" : "s"}:
                  </div>
                  {matchingRoutes.map((route) => (
                    <div key={route.id} className="flex items-center gap-2 font-semibold">
                      <ArrowRight className="inline-block size-4" />
                      <div>{route.name}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-muted-foreground text-xs italic">
                  No routes available for this asset.
                </div>
              )}
              {canUpdateInspectionRoutes && tag.asset && !isNil(matchingRoutes) && (
                <EditRoutePointButton
                  asset={tag.asset}
                  filterRoute={(r) => !matchingRoutes.some((mr) => mr.id === r.id)}
                  trigger={
                    <Button variant="default" size="sm" className="shrink-0">
                      <Plus />
                      Add to Route
                    </Button>
                  }
                  linkToRoutes={"/inspect/routes"}
                />
              )}
            </CardContent>
          </Card>
        )}
        {tag.asset && (
          <AssetCard
            asset={{
              ...tag.asset,
              tag: tag,
              site: tag.asset.site ?? tag.site ?? undefined,
              client: tag.asset.client ?? tag.client ?? undefined,
            }}
            processedProductImageUrl={processedProductImageUrl}
          />
        )}
        <Card>
          <CardHeader>
            <CardTitle>
              <AlertCircle />
              Setup Required
            </CardTitle>
            <CardDescription>
              This asset will need to be setup before it can be inspected.{" "}
              <span className="font-bold">You will only see this setup screen once.</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6 sm:gap-8">
            {tag.asset ? (
              <RemixFormProvider {...form}>
                <Form className="space-y-4" method={"post"} onSubmit={form.handleSubmit}>
                  {questions.filter((q) => q.required).length > 0 && (
                    <p className="text-muted-foreground mb-4 text-sm">
                      * indicates a required field
                    </p>
                  )}
                  <Input type="hidden" {...form.register("id")} hidden />
                  {isSetup && <Input type="hidden" {...form.register("setupOn")} hidden />}
                  {allQuestionFields.map(({ key, data }, index) => {
                    const question = questions.find((q) => q.id === data.assetQuestionId);
                    return (
                      <FormField
                        key={key}
                        control={form.control}
                        name={
                          data.id
                            ? `setupQuestionResponses.updateMany.${index}.data.value`
                            : `setupQuestionResponses.createMany.data.${index}.value`
                        }
                        render={({ field: { value, onChange, onBlur } }) => (
                          <FormItem>
                            <div>
                              <FormLabel>
                                {question?.prompt ?? (
                                  <span className="italic">
                                    Prompt for this question has been removed or is not available.
                                  </span>
                                )}
                                {question?.required && " *"}
                              </FormLabel>
                              {question?.helpText && (
                                <FormDescription>{question?.helpText}</FormDescription>
                              )}
                              <AssetQuestionRegulatoryCodesDisplay
                                regulatoryCodes={question?.regulatoryCodes}
                              />
                              <AssetQuestionFilesDisplay files={question?.files} />
                            </div>
                            <FormControl>
                              <AssetQuestionResponseTypeInput
                                value={value}
                                onValueChange={onChange}
                                onBlur={onBlur}
                                valueType={question?.valueType ?? "BINARY"}
                                // Disabling for now.
                                // TODO: Not sure if questions should be able to be updated after setup.
                                disabled={isSetup || !question}
                                tone={question?.tone ?? ASSET_QUESTION_TONES.NEUTRAL}
                                options={question?.selectOptions ?? undefined}
                                placeholder={question?.placeholder}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    );
                  })}
                  {allQuestionFields.length === 0 && (
                    <p className="text-center text-xs font-bold">
                      <span className="font-bold">No setup questions found.</span>{" "}
                      {isSetup ? (
                        <>There is nothing to update.</>
                      ) : (
                        <>Go ahead and click complete setup to begin your inspection.</>
                      )}
                    </p>
                  )}
                  <Button
                    type="submit"
                    // TODO: Not sure if questions should be able to be updated after setup.
                    // Disabling for now.
                    disabled={isSetup || isSubmitting || (isSetup && !isDirty) || !isValid}
                    variant={isSetup ? "secondary" : "default"}
                    className={cn("w-full", isSubmitting && "animate-pulse")}
                  >
                    {isSubmitting ? "Processing..." : isSetup ? "Setup Complete" : "Complete Setup"}
                  </Button>
                  {isSetup && (
                    <Button variant="default" asChild type="button" className="w-full">
                      <Link to={`/inspect/`}>Begin Inspection</Link>
                    </Button>
                  )}
                </Form>
              </RemixFormProvider>
            ) : (
              <Alert variant="warning">
                <AlertTitle>Oops! This tag hasn&apos;t been registered correctly.</AlertTitle>
                <AlertDescription>
                  Please contact your administrator to ensure this tag is assigned to an asset.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
