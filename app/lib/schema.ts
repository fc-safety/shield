import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ClientStatuses } from "./models";

const refById = z.object({
  connect: z.object({
    id: z.string(),
  }),
});

export const addressSchema = z.object({
  id: z.string().optional(),
  street1: z.string().min(1),
  street2: z
    .nullable(z.string())
    .optional()
    .transform((street2) => street2 || undefined),
  city: z.string().min(1),
  state: z.string().min(2),
  zip: z.string().length(5),
});
export const addressSchemaResolver = zodResolver(addressSchema);

export const createClientSchema = z.object({
  externalId: z
    .string()
    .length(24)
    .optional()
    .transform((id) => id || undefined),
  name: z.string().min(1),
  startedOn: z.coerce.date(),
  address: z.object({
    create: addressSchema,
  }),
  status: z.enum(ClientStatuses).optional(),
  phoneNumber: z
    .string()
    .regex(/^(\+1)?\d{10}$/, "Phone must include 10 digit number."),
  homeUrl: z
    .nullable(z.string())
    .optional()
    .transform((url) => url || undefined),
});
export const createClientSchemaResolver = zodResolver(createClientSchema);

export const updateClientSchema = createClientSchema
  .omit({ externalId: true })
  .extend({
    id: z.string(),
    address: z.object({ update: addressSchema.partial() }),
  })
  .partial();
export const updateClientSchemaResolver = zodResolver(updateClientSchema);

export const createSiteSchema = z.object({
  externalId: z
    .string()
    .length(24)
    .optional()
    .transform((id) => id || undefined),
  primary: z.boolean().default(false),
  name: z.string(),
  address: z.object({
    create: addressSchema,
  }),
  phoneNumber: z
    .string()
    .regex(/^(\+1)?\d{10}$/, "Phone must include 10 digit number."),
  client: z.object({
    connect: z.object({
      id: z.string(),
    }),
  }),
  parentSite: z
    .object({
      connect: z.object({
        id: z.string(),
      }),
    })
    .optional(),
});
export const createSiteSchemaResolver = zodResolver(createSiteSchema);

export const updateSiteSchema = createSiteSchema
  .omit({ externalId: true })
  .extend({
    id: z.string(),
    address: z.object({ update: addressSchema.partial() }),
  })
  .partial();
export const updateSiteSchemaResolver = zodResolver(updateSiteSchema);

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
