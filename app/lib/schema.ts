import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  AssetQuestionResponseTypes,
  AssetQuestionTypes,
  ClientStatuses,
  ProductTypes,
} from "./models";

export const addressSchema = z.object({
  id: z.string().optional(),
  street1: z.string().nonempty(),
  street2: z
    .nullable(z.string())
    .optional()
    .transform((street2) => street2 || undefined),
  city: z.string().nonempty(),
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
  name: z.string().nonempty(),
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

export const createProductCategorySchema = z.object({
  id: z.string().optional(),
  active: z.boolean(),
  name: z.string().nonempty(),
  shortName: z.string().optional(),
  description: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
});
export const createProductCategorySchemaResolver = zodResolver(
  createProductCategorySchema
);

export const updateProductCategorySchema = createProductCategorySchema
  .extend({ id: z.string() })
  .partial();
export const updateProductCategorySchemaResolver = zodResolver(
  updateProductCategorySchema
);

export const createManufacturerSchema = z.object({
  id: z.string().optional(),
  active: z.boolean(),
  name: z.string().nonempty(),
  homeUrl: z.string().optional(),
});
export const createManufacturerSchemaResolver = zodResolver(
  createManufacturerSchema
);

export const updateManufacturerSchema = createManufacturerSchema
  .extend({ id: z.string() })
  .partial();
export const updateManufacturerSchemaResolver = zodResolver(
  updateManufacturerSchema
);

export const createProductSchema = z.object({
  id: z.string().optional(),
  active: z.boolean().default(true),
  manufacturer: z.object({
    connect: z.object({
      id: z.string(),
    }),
  }),
  type: z.enum(ProductTypes).default("PRIMARY"),
  name: z.string().nonempty(),
  description: z.string().optional(),
  sku: z.string().optional(),
  productUrl: z.string().optional(),
  imageUrl: z.string().optional(),
  productCategory: z.object({
    connect: z.object({
      id: z.string(),
    }),
  }),
});
export const createProductSchemaResolver = zodResolver(createProductSchema);

export const updateProductSchema = createProductSchema
  .extend({ id: z.string() })
  .partial();
export const updateProductSchemaResolver = zodResolver(updateProductSchema);

export const createTagSchema = z.object({
  id: z.string().optional(),
  serialNumber: z.string(),
  asset: z
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
export const createTagSchemaResolver = zodResolver(createTagSchema);

export const updateTagSchema = createTagSchema
  .extend({ id: z.string() })
  .partial();
export const updateTagSchemaResolver = zodResolver(updateTagSchema);

export const createAssetSchema = z.object({
  active: z.boolean(),
  name: z.string().nonempty(),
  location: z.string().nonempty(),
  placement: z.string().nonempty(),
  serialNumber: z.string().nonempty(),
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

export const createAssetQuestionSchema = z.object({
  active: z.boolean().default(true),
  type: z.enum(AssetQuestionTypes),
  required: z.boolean().default(false),
  order: z.number().optional(),
  prompt: z.string().nonempty(),
  valueType: z.enum(AssetQuestionResponseTypes),
});
export const createAssetQuestionSchemaResolver = zodResolver(
  createAssetQuestionSchema
);

export const updateAssetQuestionSchema = createAssetQuestionSchema
  .partial()
  .extend({ id: z.string() });
export const updateAssetQuestionSchemaResolver = zodResolver(
  updateAssetQuestionSchema
);

// TODO: Below is old code, may need to be updated
export const buildReportSchema = z.object({
  id: z.string().optional(),
  title: z.string().nonempty(),
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
