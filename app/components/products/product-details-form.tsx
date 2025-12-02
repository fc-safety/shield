import LegacyIdField from "@/components/ui-custom/forms/legacy-id-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import type { z } from "zod";
import type { ViewContext } from "~/.server/api-utils";
import { useAuth } from "~/contexts/auth-context";
import { useModalFetcher } from "~/hooks/use-modal-fetcher";
import { connectOrEmpty } from "~/lib/model-form-converters";
import { type Manufacturer, type Product, type ProductCategory } from "~/lib/models";
import { createProductSchema, updateProductSchema } from "~/lib/schema";
import { serializeFormJson } from "~/lib/serializers";
import { buildPath } from "~/lib/urls";
import { can, isGlobalAdmin } from "~/lib/users";
import { nullValuesToUndefined, slugify } from "~/lib/utils";
import { ImageUploadInput } from "../image-upload-input";
import ActiveToggleField from "../ui-custom/forms/active-toggle-field";
import MetadataInputField from "../ui-custom/forms/metadata-input-field";
import { Field, FieldContent, FieldDescription, FieldError, FieldLabel } from "../ui/field";
import { Switch } from "../ui/switch";
import AnsiCategoryCombobox from "./ansi-category-combobox";
import ManufacturerSelector from "./manufacturer-selector";
import { ProductImage } from "./product-card";
import ProductCategorySelector from "./product-category-selector";

type TForm = z.infer<typeof createProductSchema | typeof updateProductSchema>;
export interface ProductDetailsFormProps {
  product?: Product;
  onSubmitted?: () => void;
  parentProduct?: Product;
  productCategory?: ProductCategory;
  manufacturer?: Manufacturer;
  consumable?: boolean;
  viewContext?: ViewContext;
  clientId?: string;
}

export default function ProductDetailsForm({
  product,
  onSubmitted,
  parentProduct,
  productCategory,
  manufacturer,
  consumable = false,
  viewContext,
  clientId,
}: ProductDetailsFormProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const { user } = useAuth();
  const userIsGlobalAdmin = isGlobalAdmin(user);
  const canReadAnsiCategories = can(user, "read", "ansi-categories");

  const isNew = !product;
  const requireConsumable = Boolean(consumable || parentProduct);

  const FORM_DEFAULTS = useMemo(
    () =>
      ({
        id: "",
        active: true,
        type: requireConsumable ? "CONSUMABLE" : "PRIMARY",
        productCategory: {
          connect: {
            id: productCategory?.id ?? parentProduct?.productCategoryId ?? "",
          },
        },
        manufacturer: {
          connect: {
            id: manufacturer?.id ?? parentProduct?.manufacturerId ?? "",
          },
        },
        name: "",
        description: "",
        sku: "",
        productUrl: "",
        parentProduct: parentProduct
          ? {
              connect: {
                id: parentProduct.id,
              },
            }
          : undefined,
        client: connectOrEmpty(clientId),
      }) satisfies TForm,
    [clientId]
  );

  const form = useForm({
    resolver: zodResolver(isNew ? createProductSchema : updateProductSchema),
    values: (product
      ? {
          ...nullValuesToUndefined(product),
          productCategory: {
            connect: {
              id: product.productCategoryId,
            },
          },
          manufacturer: {
            connect: {
              id: product.manufacturerId,
            },
          },
          description: product.description ?? "",
          sku: product.sku ?? "",
          productUrl: product.productUrl ?? "",
          imageUrl: product.imageUrl ?? "",
          client: connectOrEmpty(product.client, "id") ?? connectOrEmpty(clientId),
          parentProduct: parentProduct ? { connect: { id: parentProduct.id } } : undefined,
          ansiCategory: product.ansiCategory
            ? { connect: { id: product.ansiCategory.id } }
            : undefined,
        }
      : FORM_DEFAULTS) as TForm,
    mode: "onBlur",
  });

  const {
    formState: { isDirty, isValid },
    watch,
  } = form;

  const productType = watch("type");

  const { createOrUpdateJson: submit, isSubmitting: isSubmittingData } = useModalFetcher({
    onSubmitted,
  });

  const [image, setImage] = useState<File | null>(null);
  const handleImageChange = (onChange: (value: unknown) => void) => (file: File | null) => {
    if (file) {
      setImage(file);
    }
    onChange(file?.name);
  };

  const { mutate: uploadImage, isPending: isUploadingImage } = useMutation<
    string,
    Error,
    { data: TForm; image: File }
  >({
    mutationFn: async ({ data, image }: { data: TForm; image: File }) => {
      const ext = image.type.split("/").pop();

      // Build key from product (and parent product if it exists).
      const key = `product-images/${format(new Date(), "yyyy-MM-dd")}_${
        parentProduct?.name ? `${slugify(parentProduct.name)}_` : ""
      }${slugify(data.name ?? "unnamed")}${ext ? `.${ext}` : ""}`;

      const getUrlResponse = await fetch(buildPath("/api/image-upload-url", { key, public: "" }));
      if (getUrlResponse.ok) {
        const { getUrl, putUrl } = await getUrlResponse.json();
        const uploadResponse = await fetch(putUrl, {
          method: "PUT",
          body: image,
        });
        if (!uploadResponse.ok) {
          throw new Error("Failed to upload image", {
            cause: uploadResponse,
          });
        }
        return getUrl;
      }

      throw new Error("Failed to get image upload URL", {
        cause: getUrlResponse,
      });
    },
  });

  const isSubmitting = isSubmittingData || isUploadingImage;

  const handleSubmit = async (data: TForm) => {
    const doSubmit = (data: TForm) => {
      return submit(serializeFormJson(data), {
        path: "/api/proxy/products",
        id: product?.id,
        viewContext,
      });
    };

    if (image) {
      uploadImage(
        {
          data,
          image,
        },
        {
          onSuccess: (imageUrl) => {
            doSubmit({
              ...data,
              imageUrl,
            });
          },
        }
      );
    } else {
      doSubmit(data);
    }
  };

  return (
    <FormProvider {...form}>
      <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
        <Input type="hidden" {...form.register("id")} hidden />
        <ActiveToggleField />
        {productType === "PRIMARY" ? (
          <LegacyIdField
            form={form}
            fieldName="legacyProductId"
            label="Legacy Product ID"
            description="Product ID from the legacy Shield system"
          />
        ) : (
          <LegacyIdField
            form={form}
            fieldName="legacyConsumableId"
            label="Legacy Consumable ID"
            description="Consumable ID from the legacy Shield system"
          />
        )}
        {!parentProduct && (
          <>
            {!productCategory && (
              <Controller
                control={form.control}
                name="productCategory"
                render={({ field: { value, onChange, onBlur }, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="product-category-selector">Category</FieldLabel>
                    <ProductCategorySelector
                      value={value?.connect.id}
                      onValueChange={(id) => onChange({ connect: { id } })}
                      onBlur={onBlur}
                      className="flex"
                      viewContext={viewContext}
                      clientId={clientId}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            )}
            {!manufacturer && (
              <Controller
                control={form.control}
                name="manufacturer"
                render={({ field: { value, onChange, onBlur }, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="manufacturer-selector">Manufacturer</FieldLabel>
                    <ManufacturerSelector
                      value={value?.connect.id}
                      onValueChange={(id) => onChange({ connect: { id } })}
                      onBlur={onBlur}
                      className="flex"
                      viewContext={viewContext}
                      clientId={clientId}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            )}
          </>
        )}
        <Controller
          control={form.control}
          name="name"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="name">Name</FieldLabel>
              <Input id="name" {...field} aria-invalid={fieldState.invalid} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="description"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="description">Description</FieldLabel>
              <Textarea id="description" {...field} aria-invalid={fieldState.invalid} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        {(parentProduct || productType === "CONSUMABLE") && canReadAnsiCategories && (
          <>
            <Controller
              control={form.control}
              name="displayExpirationDate"
              render={({ field: { value, onChange, onBlur }, fieldState }) => (
                <Field data-invalid={fieldState.invalid} orientation="horizontal">
                  <Switch
                    id="display-expiration-date"
                    className="self-start"
                    checked={value}
                    onCheckedChange={onChange}
                    onBlur={onBlur}
                    aria-invalid={fieldState.invalid}
                  />
                  <FieldContent>
                    <FieldLabel htmlFor="display-expiration-date">
                      Highlight expiration date
                    </FieldLabel>
                    <FieldDescription>
                      Display the expiration date of this supply during important actions, such as
                      while inspecting.
                    </FieldDescription>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </FieldContent>
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="ansiCategory"
              render={({ field: { value, onChange, onBlur }, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="ansi-category-combobox">ANSI Category</FieldLabel>
                  <AnsiCategoryCombobox
                    value={value?.connect?.id}
                    onValueChange={(id) =>
                      onChange(id ? { connect: { id } } : { disconnect: true })
                    }
                    onBlur={onBlur}
                    className="flex w-full"
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </>
        )}
        <Controller
          control={form.control}
          name="sku"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="sku">SKU</FieldLabel>
              <Input id="sku" {...field} aria-invalid={fieldState.invalid} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="productUrl"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="product-url">Product URL</FieldLabel>
              <Input id="product-url" {...field} aria-invalid={fieldState.invalid} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="imageUrl"
          render={({ field: { value, onChange, ...field }, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="image-url">Image</FieldLabel>
              {(image || value) && (
                <ProductImage
                  imageUrl={image?.name ? URL.createObjectURL(image) : value}
                  name="Product"
                  className="w-full rounded-sm"
                />
              )}
              <ImageUploadInput
                id="image-url"
                onImageChange={handleImageChange(onChange)}
                accept="image/*"
                className="w-full"
                {...field}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        {/* Advanced Section */}
        {userIsGlobalAdmin && (
          <div className="rounded-lg border p-4">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="hover:text-muted-foreground flex w-full items-center justify-between text-sm font-medium transition-colors"
            >
              <span>Advanced Options</span>
              <motion.div
                animate={{ rotate: showAdvanced ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="size-4" />
              </motion.div>
            </button>
            <motion.div
              initial={false}
              animate={{
                height: showAdvanced ? "auto" : 0,
                opacity: showAdvanced ? 1 : 0,
              }}
              transition={{
                height: {
                  duration: 0.3,
                  ease: "easeInOut",
                },
                opacity: {
                  duration: 0.2,
                  ease: "easeInOut",
                },
              }}
              style={{ overflow: "hidden" }}
            >
              {" "}
              <div className="space-y-4 pt-6">
                {userIsGlobalAdmin && <MetadataInputField viewContext={viewContext} />}
              </div>
            </motion.div>
          </div>
        )}
        <Button type="submit" disabled={isSubmitting || (!isNew && !isDirty) || !isValid}>
          {isSubmitting ? "Saving..." : "Save"}
        </Button>
      </form>
    </FormProvider>
  );
}
