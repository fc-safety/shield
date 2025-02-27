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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { useModalSubmit } from "~/hooks/use-modal-submit";
import { type Product } from "~/lib/models";
import {
  createProductSchema,
  createProductSchemaResolver,
  updateProductSchemaResolver,
  type updateProductSchema,
} from "~/lib/schema";
import { buildPath } from "~/lib/urls";
import { slugify } from "~/lib/utils";
import ClientCombobox from "../clients/client-combobox";
import AnsiCategoryCombobox from "./ansi-category-combobox";
import ManufacturerSelector from "./manufacturer-selector";
import { ProductImage } from "./product-card";
import ProductCategorySelector from "./product-category-selector";

type TForm = z.infer<typeof createProductSchema | typeof updateProductSchema>;
interface ProductDetailsFormProps {
  product?: Product;
  onSubmitted?: () => void;
  canAssignOwnership?: boolean;
  parentProduct?: Product;
}

export default function ProductDetailsForm({
  product,
  onSubmitted,
  canAssignOwnership = false,
  parentProduct,
}: ProductDetailsFormProps) {
  const isNew = !product;

  const FORM_DEFAULTS = {
    id: "",
    active: true,
    type: parentProduct ? "CONSUMABLE" : "PRIMARY",
    productCategory: {
      connect: {
        id: parentProduct?.productCategoryId ?? "",
      },
    },
    manufacturer: {
      connect: {
        id: parentProduct?.manufacturerId ?? "",
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
  } satisfies TForm;

  const form = useForm<TForm>({
    resolver: isNew ? createProductSchemaResolver : updateProductSchemaResolver,
    values: product
      ? {
          ...product,
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
          client: product.client
            ? { connect: { id: product.client.id } }
            : undefined,
          parentProduct: parentProduct
            ? { connect: { id: parentProduct.id } }
            : undefined,
          ansiCategory: product.ansiCategory
            ? { connect: { id: product.ansiCategory.id } }
            : undefined,
        }
      : FORM_DEFAULTS,
    mode: "onBlur",
  });

  const {
    formState: { isDirty, isValid },
  } = form;

  const { createOrUpdateJson: submit, isSubmitting: isSubmittingData } =
    useModalSubmit({
      onSubmitted,
    });

  const [image, setImage] = useState<File | null>(null);
  const handleImageChange =
    (onChange: (value: unknown) => void) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setImage(file);
      }
      onChange(e.target.value);
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

      const getUrlResponse = await fetch(
        buildPath("/api/image-upload-url", { key, public: "" })
      );
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
    const doSubmit = (data: TForm) =>
      submit(data, {
        path: "/api/proxy/products",
        id: product?.id,
      });

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
        <FormField
          control={form.control}
          name="active"
          render={({ field: { onChange, onBlur, value } }) => (
            <FormItem className="flex items-center gap-2 space-y-0">
              <FormControl>
                <Switch
                  checked={value}
                  onCheckedChange={onChange}
                  className="pt-0"
                  onBlur={onBlur}
                />
              </FormControl>
              <FormLabel>Active</FormLabel>
              <FormMessage />
            </FormItem>
          )}
        />
        {!parentProduct && (
          <>
            <FormField
              control={form.control}
              name="productCategory"
              render={({ field: { value, onChange, onBlur } }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <ProductCategorySelector
                      value={value?.connect.id}
                      onValueChange={(id) => onChange({ connect: { id } })}
                      onBlur={onBlur}
                      className="flex"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="manufacturer"
              render={({ field: { value, onChange, onBlur } }) => (
                <FormItem>
                  <FormLabel>Manufacturer</FormLabel>
                  <FormControl>
                    <ManufacturerSelector
                      value={value?.connect.id}
                      onValueChange={(id) => onChange({ connect: { id } })}
                      onBlur={onBlur}
                      className="flex"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {parentProduct && (
          <FormField
            control={form.control}
            name="ansiCategory"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ANSI Category</FormLabel>
                <FormControl>
                  <AnsiCategoryCombobox
                    value={field.value?.connect?.id}
                    onValueChange={(id) => field.onChange({ connect: { id } })}
                    onBlur={field.onBlur}
                    className="flex w-full"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        <FormField
          control={form.control}
          name="sku"
          render={({ field }) => (
            <FormItem>
              <FormLabel>SKU</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="productUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product URL</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="imageUrl"
          render={({ field: { value, onChange, ...field } }) => (
            <FormItem>
              <FormLabel>Image</FormLabel>
              {(image || value) && (
                <ProductImage
                  imageUrl={image?.name ? URL.createObjectURL(image) : value}
                  name="Product"
                  className="w-full rounded-sm"
                />
              )}
              <FormControl>
                <Input
                  {...field}
                  onChange={handleImageChange(onChange)}
                  type="file"
                  accept="image/*"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {canAssignOwnership && (
          <FormField
            control={form.control}
            name="client.connect.id"
            render={({ field: { value, onChange } }) => (
              <FormItem>
                <FormLabel>Owner</FormLabel>
                <FormControl>
                  <ClientCombobox
                    value={value}
                    onValueChange={onChange}
                    className="w-full"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        <Button
          type="submit"
          disabled={isSubmitting || (!isNew && !isDirty) || !isValid}
        >
          {isSubmitting ? "Saving..." : "Save"}
        </Button>
      </form>
    </FormProvider>
  );
}
