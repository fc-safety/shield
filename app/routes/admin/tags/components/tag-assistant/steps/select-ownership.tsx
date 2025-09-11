import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";
import ClientCombobox from "~/components/clients/client-combobox";
import SiteCombobox from "~/components/clients/site-combobox";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import Step from "../../../../../../components/assistant/components/step";

const selectOwnershipSchema = z.object({
  clientId: z.string().nonempty("Client is required"),
  siteId: z.string().nonempty("Site is required"),
});

type TForm = z.infer<typeof selectOwnershipSchema>;

export default function StepSelectOwnership({
  onStepBackward,
  onContinue,
  clientId,
  siteId,
  setClientId,
  setSiteId,
}: {
  onStepBackward: () => void;
  onContinue: () => void;
  clientId?: string;
  siteId?: string;
  setClientId: (clientId: string) => void;
  setSiteId: (siteId: string) => void;
}) {
  const form = useForm<TForm>({
    resolver: zodResolver(selectOwnershipSchema),
    values: {
      clientId: clientId ?? "",
      siteId: siteId ?? "",
    },
    mode: "onChange",
  });

  const {
    formState: { isValid },
    watch,
    setValue,
  } = form;

  const fieldClientId = watch("clientId");
  const fieldSiteId = watch("siteId");

  useEffect(() => {
    if (!fieldClientId || !fieldSiteId) return;
    if (fieldClientId === clientId && fieldSiteId === siteId) return;
    setValue("siteId", "", {
      shouldValidate: true,
    });
  }, [fieldClientId]);

  return (
    <Step
      title="Where and to whom will this tag be registered?"
      subtitle="Select a client and site to continue."
      onStepBackward={onStepBackward}
      onContinue={() => {
        setClientId(fieldClientId);
        setSiteId(fieldSiteId);
        onContinue();
      }}
      continueDisabled={!isValid}
    >
      <FormProvider {...form}>
        <form onSubmit={() => onContinue()} className="w-full max-w-sm space-y-4 self-center pb-8">
          <FormField
            control={form.control}
            name="clientId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Which client will this tag belong to?</FormLabel>
                <FormControl>
                  <ClientCombobox
                    value={field.value}
                    onValueChange={field.onChange}
                    onBlur={field.onBlur}
                    className="w-full"
                    showClear={false}
                    viewContext="admin"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="siteId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>And which site?</FormLabel>
                <FormControl>
                  <SiteCombobox
                    value={field.value}
                    onValueChange={field.onChange}
                    onBlur={field.onBlur}
                    className="w-full"
                    clientId={fieldClientId}
                    showClear={false}
                    viewContext="admin"
                    disabled={!fieldClientId}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </FormProvider>
    </Step>
  );
}

StepSelectOwnership.StepId = "select-ownership";
