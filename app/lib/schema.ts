import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const refById = z.object({
  connect: z.object({
    id: z.string(),
  }),
});

export const addressSchema = z.object({
  id: z.string().optional(),
  street_1: z.string(),
  street_2: z.string().optional(),
  city: z.string(),
  state: z.string(),
  zip: z.string(),
});
export const addressSchemaResolver = zodResolver(addressSchema);

export const clientSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  address: refById,
});
export const clientSchemaResolver = zodResolver(clientSchema);

export const siteSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  client: refById,
  parent_site: refById.optional(),
  address: refById,
});
export const siteSchemaResolver = zodResolver(siteSchema);

export const productCategorySchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  short_name: z.string(),
  description: z.string(),
  icon: z.string(),
  color: z.string(),
});
export const productCategorySchemaResolver = zodResolver(productCategorySchema);

export const manufacturerSchema = z.object({
  id: z.string().optional(),
  active: z.boolean(),
  name: z.string(),
  home_url: z.string(),
});
export const manufacturerSchemaResolver = zodResolver(manufacturerSchema);

export const productSchema = z.object({
  id: z.string().optional(),
  active: z.boolean(),
  product_category: refById,
  manufacturer: refById,
  name: z.string(),
  description: z.string(),
  sku: z.string(),
  product_url: z.string(),
  image_url: z.string(),
});
export const productSchemaResolver = zodResolver(productSchema);

export const tagSchema = z.object({
  id: z.string().optional(),
  serial_no: z.string(),
  client: refById,
  asset: refById,
});
export const tagSchemaResolver = zodResolver(tagSchema);

export const createAssetSchema = z.object({
  active: z.boolean(),
  name: z.string().min(1),
  location: z.string().min(1),
  placement: z.string().min(1),
  serialNumber: z.string().min(1),
  product: z.object({
    connect: z.object({
      id: z.string(),
    }),
  }),
  tag: z
    .object({
      connect: z.object({
        id: z.string(),
      }),
    })
    .optional(),
  site: z
    .object({
      connect: z.object({
        id: z.string(),
      }),
    })
    .optional(),
  client: z
    .object({
      connect: z.object({
        id: z.string(),
      }),
    })
    .optional(),
});
export const createAssetSchemaResolver = zodResolver(createAssetSchema);

export const updateAssetSchema = createAssetSchema
  .extend({ id: z.string() })
  .partial();
export const updateAssetSchemaResolver = zodResolver(updateAssetSchema);

// TODO: Below is old code, may need to be updated
export const buildReportSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1),
  description: z.string(),
  type: z.enum(["asset", "inspection", "user", "location"]),
  columns: z.array(z.string()),
  dateRange: z
    .object({
      from: z.date(),
      to: z.date(),
    })
    .optional(),
});

export const buildReportSchemaResolver = zodResolver(buildReportSchema);
