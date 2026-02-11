import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";
import ClientCombobox from "~/components/clients/client-combobox";
import SiteCombobox from "~/components/clients/site-combobox";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { useAuth } from "~/contexts/auth-context";
import { useAccessIntent } from "~/contexts/requested-access-context";
import { hasMultiClientVisibility } from "~/lib/users";
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
  clientIdInputDisabled = false,
  ownershipObjectName = "tag",
}: {
  onStepBackward?: () => void;
  onContinue: () => void;
  clientId?: string;
  siteId?: string;
  setClientId: (clientId: string) => void;
  setSiteId: (siteId: string) => void;
  clientIdInputDisabled?: boolean;
  ownershipObjectName?: string;
}) {
  const { user } = useAuth();
  const accessIntent = useAccessIntent();
  const canReadClients = hasMultiClientVisibility(user);

  const form = useForm<TForm>({
    resolver: zodResolver(selectOwnershipSchema),
    defaultValues: {
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

  useEffect(() => {
    const subscription = watch(({ siteId, clientId }, { name, type }) => {
      if (type === "change") {
        if (name === "clientId" && clientId) {
          setClientId(clientId);
          if (siteId) {
            setValue("siteId", "", {
              shouldValidate: true,
            });
          }
        } else if (name === "siteId" && siteId) {
          setSiteId(siteId ?? "");
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  const fieldClientId = watch("clientId");

  return (
    <Step
      title={`Where and to whom will this ${ownershipObjectName} belong?`}
      subtitle={`Select a ${canReadClients ? "client and " : ""}site to continue.`}
      onStepBackward={onStepBackward}
      onContinue={() => {
        onContinue();
      }}
      continueDisabled={!isValid}
    >
      <FormProvider {...form}>
        <form onSubmit={() => onContinue()} className="w-full max-w-sm space-y-4 self-center pb-8">
          {canReadClients && (
            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Which client will this {ownershipObjectName} belong to?</FormLabel>
                  <FormControl>
                    <ClientCombobox
                      value={field.value}
                      onValueChange={field.onChange}
                      onBlur={field.onBlur}
                      className="w-full"
                      showClear={false}
                      disabled={clientIdInputDisabled || accessIntent !== "system"}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          <FormField
            control={form.control}
            name="siteId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {canReadClients
                    ? "And which site?"
                    : `Which site will this ${ownershipObjectName} belong to?`}
                </FormLabel>
                <FormControl>
                  <SiteCombobox
                    value={field.value}
                    onValueChange={field.onChange}
                    onBlur={field.onBlur}
                    className="w-full"
                    clientId={fieldClientId}
                    showClear={false}
                    disabled={!fieldClientId && accessIntent === "system"}
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
