import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { parseISO } from "date-fns";
import { ArrowRight, Nfc, Plus } from "lucide-react";
import { useMemo } from "react";
import { useFieldArray } from "react-hook-form";
import { data, Form, Link } from "react-router";
import { RemixFormProvider, useRemixForm } from "remix-hook-form";
import type { z } from "zod";
import { api } from "~/.server/api";
import { guard } from "~/.server/guard";
import {
  getInspectionRouteAndSessionData,
  validateTagId,
} from "~/.server/inspections";
import AssetQuestionResponseTypeInput from "~/components/assets/asset-question-response-input";
import DataList from "~/components/data-list";
import EditRoutePointButton from "~/components/inspections/edit-route-point-button";
import InspectErrorBoundary from "~/components/inspections/inspect-error-boundary";
import ProductCard from "~/components/products/product-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { useAuth } from "~/contexts/auth-context";
import type { AssetQuestion } from "~/lib/models";
import { buildSetupAssetSchema, setupAssetSchema } from "~/lib/schema";
import { can } from "~/lib/users";
import {
  buildTitle,
  cn,
  getValidatedFormDataOrThrow,
  isNil,
} from "~/lib/utils";
import type { Route } from "./+types/setup";

export const action = async ({ request }: Route.ActionArgs) => {
  const { data } = await getValidatedFormDataOrThrow<
    z.infer<typeof setupAssetSchema>
  >(request, zodResolver(setupAssetSchema));

  if (data.setupOn) {
    return api.assets.updateSetup(request, data);
  } else {
    return api.assets.setup(request, data);
  }
};

export const loader = async ({ request }: Route.LoaderArgs) => {
  const extId = await validateTagId(request, "/inspect/setup");
  await guard(request, (user) => can(user, "setup", "assets"));

  const response = await api.tags.getByExternalId(request, extId);

  if (response.data.asset?.id) {
    return getInspectionRouteAndSessionData(
      request,
      response.data.asset?.id,
      response.init ?? undefined
    ).mapTo((result) => ({
      tag: response.data,
      ...result,
    }));
  }

  return data(
    {
      tag: response.data,
      activeSessions: null,
      matchingRoutes: null,
    },
    response.init ?? undefined
  );
};

export const meta: Route.MetaFunction = ({ data, matches }) => {
  return [
    {
      title: buildTitle(
        matches,
        data?.tag.asset?.name ?? data?.tag.serialNumber,
        "Setup"
      ),
    },
  ];
};

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <InspectErrorBoundary error={error} />;
}

type TForm = z.infer<typeof setupAssetSchema>;

const onlySetupQuestions = (questions: AssetQuestion[] | undefined) =>
  (questions ?? []).filter((question) => question.type === "SETUP");

export default function InspectSetup({
  loaderData: { tag, matchingRoutes },
}: Route.ComponentProps) {
  const isSetup = !!tag.asset?.setupOn;
  const { user } = useAuth();
  const questions = useMemo(
    () =>
      [
        ...onlySetupQuestions(tag.asset?.product.assetQuestions),
        ...onlySetupQuestions(
          tag.asset?.product.productCategory.assetQuestions
        ),
      ].sort((a, b) => (a.order ?? 0) - (b.order ?? 1)),
    [tag]
  );

  const narrowedSetupAssetSchema = useMemo(() => {
    return buildSetupAssetSchema(
      questions,
      tag.asset?.setupQuestionResponses ?? []
    );
  }, [questions, tag]);

  const form = useRemixForm<TForm>({
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
    mode: "onBlur",
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

  return (
    <>
      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Route Information</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2 justify-between items-center">
            {matchingRoutes?.length ? (
              <div className="text-sm">
                <div className="mb-2">
                  This asset is currently part of {matchingRoutes.length} route
                  {matchingRoutes.length === 1 ? "" : "s"}:
                </div>
                {matchingRoutes.map((route) => (
                  <div
                    key={route.id}
                    className="flex items-center gap-2 font-semibold"
                  >
                    <ArrowRight className="size-4 inline-block" />
                    <div>{route.name}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs italic text-muted-foreground">
                No routes available for this asset.
              </div>
            )}
            {can(user, "update", "inspection-routes") &&
              tag.asset &&
              !isNil(matchingRoutes) && (
                <EditRoutePointButton
                  asset={tag.asset}
                  filterRoute={(r) =>
                    !matchingRoutes.some((mr) => mr.id === r.id)
                  }
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
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center justify-between">
              Asset Inspection Setup
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
              <RemixFormProvider {...form}>
                <Form
                  className="space-y-4"
                  method={"post"}
                  onSubmit={form.handleSubmit}
                >
                  <Input type="hidden" {...form.register("id")} hidden />
                  {isSetup && (
                    <Input type="hidden" {...form.register("setupOn")} hidden />
                  )}
                  {[
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
                  ].map(({ key, data }, index) => {
                    const question = questions.find(
                      (q) => q.id === data.assetQuestionId
                    );
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
                            <FormLabel>
                              {question?.prompt ?? (
                                <span className="italic">
                                  Prompt for this question has been removed or
                                  is not available.
                                </span>
                              )}
                            </FormLabel>
                            <FormControl>
                              <AssetQuestionResponseTypeInput
                                value={value}
                                onValueChange={onChange}
                                onBlur={onBlur}
                                valueType={question?.valueType ?? "BINARY"}
                                // Disabling for now.
                                // TODO: Not sure if questions should be able to be updated after setup.
                                disabled={isSetup || !question}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    );
                  })}
                  {createQuestionFields.length === 0 &&
                    updateQuestionFields.length === 0 && (
                      <p className="text-muted-foreground text-sm text-center">
                        No setup questions found.{" "}
                        {isSetup ? (
                          <>There is nothing to update.</>
                        ) : (
                          <>
                            Go ahead and complete setup to begin your
                            inspection.
                          </>
                        )}
                      </p>
                    )}
                  <Button
                    type="submit"
                    // TODO: Not sure if questions should be able to be updated after setup.
                    // Disabling for now.
                    disabled={
                      isSetup ||
                      isSubmitting ||
                      (isSetup && !isDirty) ||
                      !isValid
                    }
                    variant={isSetup ? "secondary" : "default"}
                    className={cn("w-full", isSubmitting && "animate-pulse")}
                  >
                    {isSubmitting
                      ? "Processing..."
                      : isSetup
                      ? "Setup Complete"
                      : "Complete Setup"}
                  </Button>
                  {isSetup && (
                    <Button
                      variant="default"
                      asChild
                      type="button"
                      className="w-full"
                    >
                      <Link to={`/inspect/?tagNo=${tag.serialNumber}`}>
                        Begin Inspection
                      </Link>
                    </Button>
                  )}
                </Form>
              </RemixFormProvider>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
