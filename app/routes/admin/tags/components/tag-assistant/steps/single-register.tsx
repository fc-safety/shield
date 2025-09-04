import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, PackagePlus, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useMemo } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";
import AssetCombobox from "~/components/assets/asset-combobox";
import ClientCombobox from "~/components/clients/client-combobox";
import SiteCombobox from "~/components/clients/site-combobox";
import { Button } from "~/components/ui/button";
import { FormControl, FormField, FormItem, FormLabel } from "~/components/ui/form";
import { useModalFetcher } from "~/hooks/use-modal-fetcher";
import { createTagSchema } from "~/lib/schema";
import SuccessCircle from "~/routes/inspect/components/success-circle";
import Step from "../components/step";
import { getAssetOptionQueryFilter } from "../utils/inputs";
import { parseTagUrl } from "../utils/parse";

const registerTagSchema = createTagSchema.extend({
  client: z.object({
    connect: z.object({
      id: z.string().nonempty(),
    }),
  }),
  site: z.object({
    connect: z.object({
      id: z.string().nonempty(),
    }),
  }),
  asset: z.object({
    connect: z.object({
      id: z.string().nonempty(),
    }),
  }),
});

type TForm = z.infer<typeof registerTagSchema>;

export default function StepSingleRegister({
  tagUrl,
  onRestart,
  onStepBackward,
  clientId,
  siteId,
  assetId,
  setClientId,
  setSiteId,
  setAssetId,
  isRegistrationCompleted,
  onRegistrationCompleted,
}: {
  tagUrl: string;
  onRestart: () => void;
  onStepBackward: () => void;
  clientId?: string;
  siteId?: string;
  assetId?: string;
  setClientId: (clientId: string) => void;
  setSiteId: (siteId: string) => void;
  setAssetId: (assetId: string) => void;
  isRegistrationCompleted: boolean;
  onRegistrationCompleted: () => void;
}) {
  const { createOrUpdateJson, isSubmitting } = useModalFetcher({
    onSubmitted: () => {
      onRegistrationCompleted();
    },
  });

  const registerTag = useCallback(
    (data: TForm) => {
      createOrUpdateJson(data, {
        path: "/api/proxy/tags",
        viewContext: "admin",
      });
    },
    [createOrUpdateJson]
  );

  const { serialNumber, externalId } = useMemo(() => parseTagUrl(tagUrl), [tagUrl]);

  const form = useForm<TForm>({
    resolver: zodResolver(registerTagSchema),
    values: {
      serialNumber,
      externalId,
      client: { connect: { id: clientId ?? "" } },
      site: { connect: { id: siteId ?? "" } },
      asset: { connect: { id: assetId ?? "" } },
    },
  });

  const {
    formState: { isValid },
    watch,
  } = form;

  useEffect(() => {
    const sub = watch((data) => {
      data.client?.connect?.id && setClientId(data.client.connect.id);
      data.site?.connect?.id && setSiteId(data.site.connect.id);
      data.asset?.connect?.id && setAssetId(data.asset.connect.id);
    });

    return () => {
      sub.unsubscribe();
    };
  }, [watch]);

  const onSubmit = (data: TForm) => {
    registerTag(data);
  };

  return (
    <Step
      title="Register the tag to a client asset."
      subtitle="This tag will now be associated with the selected asset."
      onStepBackward={onStepBackward}
      footerSlotEnd={
        <>
          <Button onClick={onRestart} variant="secondary">
            <RotateCcw /> Write another tag
          </Button>
        </>
      }
    >
      {isRegistrationCompleted ? (
        <div className="flex flex-col items-center gap-2 py-4">
          <SuccessCircle />
          <p>Tag registered successfully!</p>
        </div>
      ) : (
        <FormProvider {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="w-full max-w-sm space-y-4 self-center pb-8"
          >
            <FormField
              control={form.control}
              name="client"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Which client will this tag belong to?</FormLabel>
                  <FormControl>
                    <ClientCombobox
                      value={field.value?.connect?.id}
                      onValueChange={(id) =>
                        field.onChange(id ? { connect: { id } } : { disconnect: true })
                      }
                      onBlur={field.onBlur}
                      className="w-full"
                      showClear={false}
                      viewContext="admin"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="site"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>And which site?</FormLabel>
                  <FormControl>
                    <SiteCombobox
                      value={field.value?.connect?.id}
                      onValueChange={(id) =>
                        field.onChange(id ? { connect: { id } } : { disconnect: true })
                      }
                      onBlur={field.onBlur}
                      className="w-full"
                      clientId={clientId}
                      showClear={false}
                      viewContext="admin"
                      disabled={!clientId}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="asset"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Which asset will this tag be registered to?</FormLabel>
                  <FormControl>
                    <AssetCombobox
                      value={field.value?.connect?.id}
                      onValueChange={(id) =>
                        field.onChange(id ? { connect: { id } } : { disconnect: true })
                      }
                      className="w-full"
                      optionQueryFilter={getAssetOptionQueryFilter(
                        siteId,
                        field.value?.connect?.id
                      )}
                      clientId={clientId}
                      siteId={siteId}
                      disabled={!siteId}
                      viewContext="admin"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <Button type="submit" disabled={!isValid || isSubmitting} className="w-full">
              {isSubmitting ? <Loader2 className="animate-spin" /> : <PackagePlus />}
              Register tag
            </Button>
          </form>
        </FormProvider>
      )}
    </Step>
  );
}

StepSingleRegister.StepId = "single-register";
