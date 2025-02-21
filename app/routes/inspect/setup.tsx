import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Form as FormProvider,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { parseISO } from "date-fns";
import { Nfc } from "lucide-react";
import { useMemo } from "react";
import { useFieldArray } from "react-hook-form";
import { Form, Link } from "react-router";
import { useRemixForm } from "remix-hook-form";
import type { z } from "zod";
import { api } from "~/.server/api";
import { guard } from "~/.server/guard";
import { validateTagId } from "~/.server/inspections";
import AssetQuestionResponseTypeInput from "~/components/assets/asset-question-response-input";
import DataList from "~/components/data-list";
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
import type { AssetQuestion } from "~/lib/models";
import { buildSetupAssetSchema, setupAssetSchema } from "~/lib/schema";
import { can } from "~/lib/users";
import { buildTitle, cn, getValidatedFormDataOrThrow } from "~/lib/utils";
import type { Route } from "./+types/index";

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
  await guard(request, (user) => can(user, "setup", "assets"));

  const extId = await validateTagId(request, "/inspect/setup");
  return api.tags.getByExternalId(request, extId).mapTo((data) => ({
    tag: data,
  }));
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
  loaderData: { tag },
}: Route.ComponentProps) {
  const isSetup = !!tag.asset?.setupOn;

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
      <Card className="max-w-lg w-full">
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
            <FormProvider {...form}>
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
                                Prompt for this question has been removed or is
                                not available.
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
                          Go ahead and complete setup to begin your inspection.
                        </>
                      )}
                    </p>
                  )}
                <Button
                  type="submit"
                  // TODO: Not sure if questions should be able to be updated after setup.
                  // Disabling for now.
                  disabled={
                    isSetup || isSubmitting || (isSetup && !isDirty) || !isValid
                  }
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
                    variant="secondary"
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
            </FormProvider>
          )}
        </CardContent>
      </Card>
    </>
  );
}
