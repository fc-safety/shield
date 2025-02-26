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
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { DataOrError } from "~/.server/api-utils";
import { useAuth } from "~/contexts/auth-context";
import { useModalSubmit } from "~/hooks/use-modal-submit";
import type { Tag } from "~/lib/models";
import {
  createTagSchema,
  createTagSchemaResolver,
  updateTagSchema,
  updateTagSchemaResolver,
} from "~/lib/schema";
import { buildUrl } from "~/lib/urls";
import ClientCombobox from "../clients/client-combobox";
import SiteCombobox from "../clients/site-combobox";
import { CopyableText } from "../copyable-text";
import DataList from "../data-list";
import { Card, CardHeader } from "../ui/card";
import AssetCombobox from "./asset-combobox";

type TForm = z.infer<typeof updateTagSchema | typeof createTagSchema>;
interface TagDetailsFormProps {
  tag?: Tag;
  onClose?: () => void;
}

const FORM_DEFAULTS = {
  serialNumber: "",
} satisfies TForm;

export default function TagDetailsForm({ tag, onClose }: TagDetailsFormProps) {
  const { appHost } = useAuth();

  const isNew = !tag;

  const [isAddingSequentialTag, setIsAddingSequentialTag] = useState(false);

  const form = useForm<TForm>({
    resolver: tag ? updateTagSchemaResolver : createTagSchemaResolver,
    values: tag
      ? {
          ...tag,
          asset: tag.asset?.id
            ? {
                connect: {
                  id: tag.asset.id,
                },
              }
            : undefined,
          site: tag.siteId
            ? {
                connect: {
                  id: tag.siteId,
                },
              }
            : undefined,
          client: tag.clientId
            ? {
                connect: {
                  id: tag.clientId,
                },
              }
            : undefined,
        }
      : FORM_DEFAULTS,
    mode: "onBlur",
  });

  const {
    formState: { isDirty, isValid },
    watch,
  } = form;

  const clientId = watch("client")?.connect?.id;
  const siteId = watch("site")?.connect?.id;
  const serialNumber = watch("serialNumber");

  useEffect(() => {
    if (!clientId) {
      form.setValue("site", { disconnect: true }, { shouldValidate: true });
      form.setValue("asset", { disconnect: true }, { shouldValidate: true });
    }
  }, [clientId, form]);

  useEffect(() => {
    if (!siteId) {
      form.setValue("asset", { disconnect: true }, { shouldValidate: true });
    }
  }, [siteId, form]);

  const [recentlySavedTag, setRecentlySavedTag] = useState<Tag | null>(null);

  const handleOnSubmitted = useCallback(() => {
    if (isAddingSequentialTag) {
      form.setValue("asset", undefined);
      if (serialNumber) {
        form.setValue("serialNumber", incrementTagSerialNumber(serialNumber));
        setIsAddingSequentialTag(false);
      }
    } else {
      onClose?.();
    }
  }, [isAddingSequentialTag, onClose, serialNumber, form]);

  const { createOrUpdateJson: submit, isSubmitting } = useModalSubmit<
    DataOrError<Tag>
  >({
    onSubmitted: handleOnSubmitted,
    onData: ({ data }) => setRecentlySavedTag(data ?? null),
  });

  const handleSubmit = (data: TForm) => {
    submit(data, {
      path: "/api/proxy/tags",
      id: tag?.id,
    });
  };

  return (
    <FormProvider {...form}>
      <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
        {recentlySavedTag && (
          <Card>
            <CardHeader>
              <DataList
                title="Recently Saved Tag"
                details={[
                  {
                    label: "Serial Number",
                    value: recentlySavedTag.serialNumber,
                  },
                  {
                    label: "Inspection URL",
                    value: (
                      <CopyableText
                        text={buildUrl("/inspect", appHost, {
                          extId: recentlySavedTag.externalId,
                        }).toString()}
                      />
                    ),
                  },
                ]}
                fluid
              />
            </CardHeader>
          </Card>
        )}
        <Input type="hidden" {...form.register("id")} hidden />
        <FormField
          control={form.control}
          name="serialNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Serial Number</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="client"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {field.value?.connect?.id ? "Assigned client" : "Assign client"}
              </FormLabel>
              <FormControl>
                <ClientCombobox
                  value={field.value?.connect?.id}
                  onValueChange={(id) =>
                    field.onChange(
                      id ? { connect: { id } } : { disconnect: true }
                    )
                  }
                  onBlur={field.onBlur}
                  className="w-full"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="site"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {field.value?.connect?.id ? "Assigned site" : "Assign site"}
              </FormLabel>
              <FormControl>
                <SiteCombobox
                  value={field.value?.connect?.id}
                  onValueChange={(id) =>
                    field.onChange(
                      id ? { connect: { id } } : { disconnect: true }
                    )
                  }
                  onBlur={field.onBlur}
                  className="w-full"
                  clientId={clientId}
                  disabled={!clientId}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="asset"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {field.value?.connect?.id ? "Assigned asset" : "Assign asset"}
              </FormLabel>
              <FormControl>
                <AssetCombobox
                  value={field.value?.connect?.id}
                  onValueChange={(id) =>
                    field.onChange(
                      id ? { connect: { id } } : { disconnect: true }
                    )
                  }
                  onBlur={field.onBlur}
                  className="w-full"
                  optionQueryFilter={getAssetOptionQueryFilter(
                    siteId,
                    field.value?.connect?.id
                  )}
                  disabled={!siteId}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex gap-2">
          <Button
            type="submit"
            disabled={isSubmitting || (!isNew && !isDirty) || !isValid}
          >
            {isSubmitting ? "Saving..." : "Save"}
          </Button>
          <div className="flex-1"></div>
          {isNew && (
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting || (!isNew && !isDirty) || !isValid}
              onClick={() => {
                setIsAddingSequentialTag(true);
                form.handleSubmit(handleSubmit)();
              }}
            >
              Save and add another
            </Button>
          )}
        </div>
      </form>
    </FormProvider>
  );
}

const incrementTagSerialNumber = (serialNumber: string) => {
  const trailingNumberMatch = serialNumber.match(/\d+$/);
  if (!trailingNumberMatch) {
    return serialNumber;
  }

  // Serial numbers will typically be all numbers, but may be padded with leading zeroes.
  // Try to preserve the padding when incrementing.
  let padSize: number | null = null;
  if (
    trailingNumberMatch[0].length === serialNumber.length &&
    serialNumber.startsWith("0")
  ) {
    padSize = serialNumber.length;
  }

  const incrementedTrailingNumber = parseInt(trailingNumberMatch[0]) + 1;

  if (padSize) {
    return String(incrementedTrailingNumber).padStart(padSize, "0");
  } else {
    return serialNumber.replace(/\d+$/, incrementedTrailingNumber.toString());
  }
};

const getAssetOptionQueryFilter = (
  siteId: string | undefined,
  assetId: string | undefined
) => {
  if (!siteId) {
    return {};
  }

  const baseFilter = {
    site: {
      id: siteId,
    },
    tagId: "_NULL",
  };

  if (!assetId) {
    return baseFilter;
  }

  return {
    OR: [
      baseFilter,
      {
        id: assetId,
      },
    ],
  };
};
