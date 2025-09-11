import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm, type UseFormReturn } from "react-hook-form";
import type z from "zod";
import type { DataOrError, ViewContext } from "~/.server/api-utils";
import { AssetDetailFormFields } from "~/components/assets/asset-details-form";
import Step from "~/components/assistant/components/step";
import { Button } from "~/components/ui/button";
import { Form } from "~/components/ui/form";
import { useModalFetcher } from "~/hooks/use-modal-fetcher";
import type { Asset } from "~/lib/models";
import { createAssetSchema, updateAssetSchema } from "~/lib/schema";

type TForm = z.infer<typeof createAssetSchema | typeof updateAssetSchema>;

export default function StepAssetDetailsForm({
  onStepBackward,
  onContinue,
  onClose,
  assetData,
  setAssetData,
  viewContext,
  continueLabel,
}: {
  onStepBackward: () => void;
  onContinue?: (data: Asset) => void;
  onClose?: () => void;
  assetData?: Partial<Asset>;
  setAssetData?: (data: Partial<Asset>) => void;
  viewContext?: ViewContext;
  continueLabel?: string;
}) {
  const form = useForm({
    resolver: zodResolver(assetData?.id ? updateAssetSchema : createAssetSchema),
    defaultValues: {
      name: "",
      active: true,
      serialNumber: "",
      location: "",
      placement: "",
      metadata: {},
      ...assetData,
      product: assetData?.productId
        ? {
            connect: {
              id: assetData.productId,
            },
          }
        : undefined,
      site: assetData?.siteId
        ? {
            connect: {
              id: assetData.siteId,
            },
          }
        : undefined,
      client: assetData?.clientId
        ? {
            connect: {
              id: assetData.clientId,
            },
          }
        : undefined,
    },
  });

  const {
    formState: { isValid },
  } = form;

  const { createOrUpdateJson: submit, isSubmitting } = useModalFetcher<DataOrError<Asset>>();

  const handleSubmit = ({
    onSubmitted,
    data,
  }: {
    onSubmitted?: (data: DataOrError<Asset>) => void;
    data?: TForm;
  } = {}) => {
    const newAsset = data ?? form.getValues();
    submit(newAsset, {
      path: "/api/proxy/assets",
      viewContext,
      onSubmitted: (data) => {
        if (data.data) {
          setAssetData?.(data.data);
        }
        onSubmitted?.(data);
      },
    });
  };

  return (
    <Step
      title="Just a few more details..."
      subtitle="This is needed to finish storing your asset in the system."
      onStepBackward={onStepBackward}
      onContinue={
        onContinue
          ? () => {
              handleSubmit({
                onSubmitted: (data) => data.data && onContinue(data.data),
              });
            }
          : undefined
      }
      footerSlotEnd={
        onContinue ? null : (
          <Button
            type="button"
            disabled={!isValid || isSubmitting}
            onClick={() =>
              handleSubmit({
                onSubmitted: onClose,
              })
            }
          >
            {isSubmitting && <Loader2 className="animate-spin" />}
            Save{onClose ? " & Close" : ""}
          </Button>
        )
      }
      continueDisabled={!isValid}
      continueLoading={isSubmitting}
      continueButtonText={`Save & ${continueLabel ?? "Continue"}`}
    >
      <Form {...form}>
        <form
          className="space-y-4"
          onSubmit={form.handleSubmit((data) =>
            handleSubmit({
              data,
              onSubmitted: (newData) =>
                newData.data && onContinue ? onContinue(newData.data) : onClose,
            })
          )}
        >
          <AssetDetailFormFields
            form={
              form as UseFormReturn<z.infer<typeof createAssetSchema | typeof updateAssetSchema>>
            }
            showActiveToggle={false}
            viewContext={viewContext}
          />
        </form>
      </Form>
    </Step>
  );
}

StepAssetDetailsForm.StepId = "asset-details-form";
