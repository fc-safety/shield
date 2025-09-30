import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Eraser, Loader2, Package, Pencil, Wrench } from "lucide-react";
import { useMemo } from "react";
import { useFormContext } from "react-hook-form";
import type z from "zod";
import HelpPopover from "~/components/help-popover";
import { Button } from "~/components/ui/button";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { useAuthenticatedFetch } from "~/hooks/use-authenticated-fetch";
import type { Product, ResultsPage } from "~/lib/models";
import type { updateAssetQuestionSchema } from "~/lib/schema";
import { useAssetQuestionDetailFormContext } from "../../asset-question-detail-form.context";
import { AutoSetupSupplyConfigurator } from "../sidepanel-inserts/auto-setup-supply-configurator";

type TForm = Pick<z.infer<typeof updateAssetQuestionSchema>, "consumableConfig">;

export default function AutomaticSupplySetupInput() {
  const { openSidepanel, closeSidepanel } = useAssetQuestionDetailFormContext();
  const {
    watch,
    setValue,
    control,
    formState: { defaultValues },
  } = useFormContext<TForm>();
  const { fetchOrThrow } = useAuthenticatedFetch();

  const autoSetupSupplyConfigInput = watch("consumableConfig");

  const defaultAutoSetupSupplyConfig = useMemo(() => {
    if (!defaultValues?.consumableConfig) return;

    if (defaultValues.consumableConfig.update) {
      return defaultValues.consumableConfig.update;
    }

    return defaultValues.consumableConfig.create;
  }, [defaultValues]);

  const autoSetupSupplyConfig = useMemo(() => {
    if (!autoSetupSupplyConfigInput) return;

    if (
      "update" in autoSetupSupplyConfigInput &&
      autoSetupSupplyConfigInput.update?.consumableProduct?.connect?.id
    ) {
      return autoSetupSupplyConfigInput.update;
    }

    if (autoSetupSupplyConfigInput.create) {
      return autoSetupSupplyConfigInput.create;
    }
  }, [autoSetupSupplyConfigInput]);

  const autoSetupSupplyProductId = autoSetupSupplyConfig?.consumableProduct?.connect?.id;

  const { data: autoSetupSupply, isLoading: isLoadingAutoSetupSupply } = useQuery({
    queryKey: ["product-with-parent", autoSetupSupplyProductId],
    queryFn: ({ queryKey }) =>
      fetchOrThrow(`/products/?id=${queryKey[1]}&include[parentProduct]=true`, { method: "GET" })
        .then((r) => r.json() as Promise<ResultsPage<Product>>)
        .then((products) => products.results.at(0)),
    enabled: !!autoSetupSupplyProductId,
  });

  return (
    <FormField
      control={control}
      name="consumableConfig"
      render={() => {
        return (
          <FormItem className="gap-0">
            <FormLabel className="mb-2 inline-flex items-center gap-2 text-base font-medium">
              <Package className="size-4" />
              Automatic Supply Setup
              <HelpPopover>
                <p>
                  Configure a supply to be setup automatically when a user answers this question
                  during an inspection.
                </p>
              </HelpPopover>
              {autoSetupSupplyConfig && (
                <>
                  <Button
                    size="iconSm"
                    variant="outline"
                    type="button"
                    onClick={() => openSidepanel(AutoSetupSupplyConfigurator.Id)}
                  >
                    <Pencil />
                  </Button>
                  <Button
                    size="iconSm"
                    variant="outline"
                    type="button"
                    onClick={() => {
                      if (!autoSetupSupplyConfigInput) return;
                      if (!defaultAutoSetupSupplyConfig) {
                        setValue("consumableConfig", undefined, {
                          shouldDirty: true,
                        });
                      } else {
                        setValue(
                          "consumableConfig",
                          {
                            delete: true,
                          },
                          {
                            shouldDirty: true,
                          }
                        );
                      }
                      closeSidepanel();
                    }}
                  >
                    <Eraser className="text-destructive" />
                  </Button>
                </>
              )}
            </FormLabel>
            <FormControl>
              <div className="space-y-4">
                {autoSetupSupplyConfig ? (
                  <div className="text-sm">
                    A{" "}
                    <div className="border-border inline-block rounded-sm border px-1 py-0.5">
                      {isLoadingAutoSetupSupply ? (
                        <Loader2 className="size-3 animate-spin" />
                      ) : autoSetupSupply ? (
                        <div className="flex items-center gap-1">
                          {autoSetupSupply.parentProduct?.name}
                          <ChevronRight className="size-3" />
                          {autoSetupSupply.name}
                        </div>
                      ) : (
                        "unknown supply"
                      )}
                    </div>{" "}
                    will be setup under the asset with the question response as the{" "}
                    <div className="border-border inline-block rounded-sm border px-1 py-0.5">
                      {autoSetupSupplyConfig.mappingType === "EXPIRATION_DATE"
                        ? "expiration date"
                        : "unknown"}
                    </div>
                    .
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    type="button"
                    className="w-full"
                    onClick={() => {
                      setValue(
                        "consumableConfig",
                        defaultAutoSetupSupplyConfig
                          ? {
                              update: {
                                consumableProduct: {
                                  connect: {
                                    id:
                                      defaultAutoSetupSupplyConfig.consumableProduct?.connect?.id ??
                                      "",
                                  },
                                },
                                mappingType: defaultAutoSetupSupplyConfig.mappingType,
                              },
                            }
                          : {
                              create: {
                                consumableProduct: {
                                  connect: {
                                    id: "",
                                  },
                                },
                                mappingType: "EXPIRATION_DATE",
                              },
                            },
                        {
                          shouldDirty: true,
                        }
                      );
                      openSidepanel(AutoSetupSupplyConfigurator.Id);
                    }}
                  >
                    <Wrench />
                    Configure
                  </Button>
                )}
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
