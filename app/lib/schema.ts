import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  AssetQuestionResponseTypes,
  AssetQuestionTypes,
  ClientStatuses,
  InspectionStatuses,
  ProductRequestStatuses,
  ProductTypes,
  VaultAccessTypes,
  type AssetQuestion,
  type AssetQuestionResponse,
} from "./models";
import type { ResponseValueImage } from "./types";

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

export const optionalConnectSchema = z
  .object({
    connect: z.object({
      id: z.string().optional(),
    }),
  })
  .optional()
  .transform((v) => (v?.connect.id ? v : undefined));

export const optionalConnectOrCreateSchema = <S extends z.Schema>(
  createSchema: S
) =>
  z
    .object({
      connect: z.object({
        id: z.string().optional(),
      }),
      create: createSchema,
    })
    .partial()
    .transform(
      (v): { connect?: { id: string }; create?: z.infer<S> } | undefined => {
        if (v.create !== undefined) {
          return {
            create: v.create,
          };
        }

        return v.connect?.id ? { connect: { id: v.connect.id } } : undefined;
      }
    );

export const disconnectableSchema = z
  .object({
    connect: z.object({
      id: z.string(),
    }),
    disconnect: z.boolean(),
  })
  .partial()
  .transform(
    (v): { connect?: { id: string }; disconnect?: boolean } | undefined => {
      if (v.disconnect !== undefined) {
        return {
          disconnect: v.disconnect,
        };
      }

      return v.connect?.id ? { connect: { id: v.connect.id } } : undefined;
    }
  );

export const fromAddressSchema = z.union([
  z.string().email(),
  z
    .string()
    .regex(
      /^[A-Za-z0-9\s]+\s<[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}>$/
    ),
]);

export const createClientSchema = z.object({
  externalId: z
    .string()
    .length(24)
    .optional()
    .transform((id) => id || undefined),
  name: z.string().nonempty(),
  startedOn: z.string().datetime(),
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
  defaultInspectionCycle: z.coerce.number().default(30),
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

export const baseSiteSchema = z.object({
  id: z.string().optional(),
  externalId: z
    .string()
    .length(24)
    .optional()
    .transform((id) => id || undefined),
  primary: z.boolean().default(false),
  name: z.string(),
  address: z
    .object({
      create: addressSchema,
      update: addressSchema.partial(),
    })
    .partial(),
  phoneNumber: z
    .string()
    .regex(/^(\+1)?\d{10}$/, "Phone must include 10 digit number."),
  client: z.object({
    connect: z.object({
      id: z.string(),
    }),
  }),
  parentSite: optionalConnectSchema,
  subsites: z
    .object({
      connect: z.array(z.object({ id: z.string() })).min(1),
      set: z.array(z.object({ id: z.string() })).min(1),
    })
    .partial()
    .optional(),
});

export const getSiteSchema = ({
  create,
  isSiteGroup = false,
}: {
  create: boolean;
  isSiteGroup?: boolean;
}) => {
  let schema: z.AnyZodObject = baseSiteSchema;
  if (isSiteGroup) {
    if (create) {
      schema = schema.extend({
        subsites: baseSiteSchema.shape.subsites
          .unwrap()
          .required({ connect: true }),
      });
    } else {
      schema = schema.extend({
        subsites: baseSiteSchema.shape.subsites
          .unwrap()
          .required({ set: true }),
      });
    }
  }

  if (create) {
    schema = schema.extend({
      address: baseSiteSchema.shape.address.required({ create: true }),
    });
  } else {
    schema = schema
      .omit({ externalId: true })
      .extend({
        id: z.string(),
        address: baseSiteSchema.shape.address.required({ update: true }),
      })
      .partial();
  }

  return schema;
};

export const createUserSchema = z.object({
  active: z.boolean().optional(),
  firstName: z.string().nonempty(),
  lastName: z.string().nonempty(),
  email: z.string().email(),
  phoneNumber: z
    .string()
    .regex(/^(\+1)?\d{10}$/, "Phone must include 10 digit number.")
    .optional(),
  position: z.string().optional(),
  siteExternalId: z.string().nonempty(),
});
export const createUserSchemaResolver = zodResolver(createUserSchema);

export const updateUserSchema = createUserSchema.partial();
export const updateUserSchemaResolver = zodResolver(updateUserSchema);

export const assignUserRoleSchema = z.object({
  roleId: z.string().nonempty(),
});
export const assignUserRoleSchemaResolver = zodResolver(assignUserRoleSchema);

export const createProductCategorySchema = z.object({
  id: z.string().optional(),
  active: z.boolean(),
  name: z.string().nonempty(),
  shortName: z.string().optional(),
  description: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  client: optionalConnectSchema,
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
  client: optionalConnectSchema,
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

export const createAnsiCategorySchema = z.object({
  id: z.string().optional(),
  name: z.string().nonempty(),
  description: z.string().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
});

export const updateAnsiCategorySchema = createAnsiCategorySchema
  .extend({ id: z.string() })
  .partial();

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
  client: optionalConnectSchema,
  parentProduct: optionalConnectSchema,
  ansiCategory: optionalConnectOrCreateSchema(
    createAnsiCategorySchema
  ).optional(),
});
export const createProductSchemaResolver = zodResolver(createProductSchema);

export const updateProductSchema = createProductSchema
  .extend({ id: z.string() })
  .partial();
export const updateProductSchemaResolver = zodResolver(updateProductSchema);

export const createTagSchema = z.object({
  id: z.string().optional(),
  serialNumber: z.string().nonempty(),
  asset: optionalConnectSchema,
  site: optionalConnectSchema,
  client: optionalConnectSchema,
});
export const createTagSchemaResolver = zodResolver(createTagSchema);

export const updateTagSchema = createTagSchema
  .extend({
    id: z.string(),
    client: disconnectableSchema,
    site: disconnectableSchema,
    asset: disconnectableSchema,
  })
  .partial();
export const updateTagSchemaResolver = zodResolver(updateTagSchema);

export const createAssetSchema = z.object({
  active: z.boolean(),
  name: z.string().nonempty(),
  location: z.string().nonempty(),
  placement: z.string().nonempty(),
  serialNumber: z.string().nonempty(),
  inspectionCycle: z.coerce.number().nullable().optional(),
  product: z.object({
    connect: z.object({
      id: z.string(),
    }),
  }),
  site: optionalConnectSchema,
  client: optionalConnectSchema,
});
export const createAssetSchemaResolver = zodResolver(createAssetSchema);

export const updateAssetSchema = createAssetSchema
  .extend({ id: z.string() })
  .partial();
export const updateAssetSchemaResolver = zodResolver(updateAssetSchema);

export const createConsumableSchema = z.object({
  asset: z.object({
    connect: z.object({
      id: z.string(),
    }),
  }),
  product: z.object({
    connect: z.object({
      id: z.string(),
    }),
  }),
  quantity: z.coerce.number().gte(1).optional(),
  expiresOn: z.string().datetime().optional(),
  site: optionalConnectSchema,
});
export const createConsumableSchemaResolver = zodResolver(
  createConsumableSchema
);

export const updateConsumableSchema = createConsumableSchema
  .extend({ id: z.string() })
  .partial();
export const updateConsumableSchemaResolver = zodResolver(
  updateConsumableSchema
);

export const createProductRequestItemSchema = z.object({
  productId: z.string(),
  quantity: z.coerce.number().gte(1),
});

export const createProductRequestSchema = z.object({
  productRequestItems: z.object({
    createMany: z.object({
      data: z.array(createProductRequestItemSchema).min(1),
    }),
  }),
  asset: optionalConnectSchema,
});

export const updateProductRequestSchema = z.object({
  ids: z.array(z.string()),
  status: z.enum(ProductRequestStatuses),
});

export const ruleOperatorsSchema = z
  .object({
    empty: z.literal(true),
    notEmpty: z.literal(true),
    equals: z.string(),
    not: z.string(),
    contains: z.string(),
    notContains: z.string(),
    startsWith: z.string(),
    endsWith: z.string(),
    gt: z.union([z.string(), z.number()]),
    gte: z.union([z.string(), z.number()]),
    lt: z.union([z.string(), z.number()]),
    lte: z.union([z.string(), z.number()]),
    beforeDaysPast: z.coerce.number(),
    afterDaysPast: z.coerce.number(),
    beforeDaysFuture: z.coerce.number(),
    afterDaysFuture: z.coerce.number(),
  })
  .partial();

const baseCreateAssetAlertCriterionRuleSchema = z.object({
  value: z.union([z.string(), ruleOperatorsSchema]).optional(),
});

export type CreateAssetAlertCriterionRule = z.infer<
  typeof baseCreateAssetAlertCriterionRuleSchema
> & {
  AND?: CreateAssetAlertCriterionRule[];
  OR?: CreateAssetAlertCriterionRule[];
};

export const createAssetAlertCriterionRuleSchema: z.ZodType<CreateAssetAlertCriterionRule> =
  baseCreateAssetAlertCriterionRuleSchema.extend({
    AND: z.array(baseCreateAssetAlertCriterionRuleSchema).optional(),
    OR: z.array(baseCreateAssetAlertCriterionRuleSchema).optional(),
  });

export const createAssetAlertCriterionSchema = z.object({
  rule: createAssetAlertCriterionRuleSchema,
  alertLevel: z.enum(["URGENT", "INFO"]),
});

export const updateAssetAlertCriterionSchema = createAssetAlertCriterionSchema
  .extend({ id: z.string() })
  .partial();

export const createConsumableConfigSchema = z.object({
  consumableProduct: z.object({
    connect: z.object({
      id: z.string(),
    }),
  }),
  mappingType: z.enum(["EXPIRATION_DATE"]),
});

export const createAssetQuestionSchema = z.object({
  active: z.boolean().default(true),
  type: z.enum(AssetQuestionTypes),
  required: z.boolean().default(false),
  order: z.coerce.number().optional(),
  prompt: z.string().nonempty(),
  valueType: z.enum(AssetQuestionResponseTypes),
  assetAlertCriteria: z
    .object({
      createMany: z.object({
        data: z.array(createAssetAlertCriterionSchema),
      }),
    })
    .partial()
    .optional(),
  consumableConfig: z
    .object({
      create: createConsumableConfigSchema,
    })
    .partial()
    .optional(),
});

export const createAssetQuestionSchemaResolver = zodResolver(
  createAssetQuestionSchema
);

export const updateAssetQuestionSchema = createAssetQuestionSchema
  .partial()
  .extend({
    id: z.string(),
    assetAlertCriteria: z
      .object({
        createMany: z.object({
          data: z.array(createAssetAlertCriterionSchema),
        }),
        updateMany: z.array(
          z.object({
            where: z.object({ id: z.string() }),
            data: updateAssetAlertCriterionSchema,
          })
        ),
        deleteMany: z.array(z.object({ id: z.string() })),
      })
      .partial()
      .optional(),
    consumableConfig: z
      .object({
        create: createConsumableConfigSchema,
        update: createConsumableConfigSchema.partial(),
        delete: z.boolean().default(false),
      })
      .partial()
      .optional(),
  });
export const updateAssetQuestionSchemaResolver = zodResolver(
  updateAssetQuestionSchema
);

export const responseValueImageSchema = z.object({
  urls: z.array(z.string()),
}) satisfies z.Schema<ResponseValueImage>;

export const createAssetQuestionResponseSchema = z.object({
  id: z.string().optional(),
  value: z.union([z.string(), z.number().safe(), responseValueImageSchema]),
  assetQuestionId: z.string().nonempty(),
});
export const createAssetQuestionResponseSchemaResolver = zodResolver(
  createAssetQuestionResponseSchema
);

export const createInspectionSchema = z.object({
  asset: z.object({
    connect: z.object({
      id: z.string().nonempty(),
    }),
  }),
  status: z.enum(InspectionStatuses),
  latitude: z.number().safe().gte(-90).lte(90),
  longitude: z.number().safe().gte(-180).lte(180),
  locationAccuracy: z.number().optional(),
  comments: z.string().optional(),
  responses: z.object({
    createMany: z.object({
      data: z.array(createAssetQuestionResponseSchema),
    }),
  }),
});

const buildZodTypeFromQuestion = (question: AssetQuestion) => {
  if (question.required) {
    return z.union([
      z.string().nonempty("This question is required"),
      z.number().safe(),
      z.object({
        urls: z.array(z.string()).min(1),
      }),
    ]);
  }

  return z.union([z.string(), z.number().safe()]);
};

export const buildInspectionSchema = (questions: AssetQuestion[]) =>
  createInspectionSchema.extend({
    responses: z.object({
      createMany: z.object({
        data: z.tuple(
          questions.map((q) =>
            createAssetQuestionResponseSchema.extend({
              value: buildZodTypeFromQuestion(q),
            })
          ) as unknown as [z.ZodTypeAny, ...z.ZodTypeAny[]]
        ),
      }),
    }),
  });

export const createInspectionRouteSchema = z.object({
  id: z.string().optional(),
  name: z.string().nonempty(),
  description: z.string().optional(),
  inspectionRoutePoints: z.array(
    z.object({
      order: z.coerce.number(),
      asset: optionalConnectSchema,
    })
  ),
  siteId: z.string().optional(),
});

export const updateInspectionRouteSchema = createInspectionRouteSchema
  .partial()
  .extend({ id: z.string() });

export const createInspectionRoutePointSchema = z.object({
  id: z.string().optional(),
  order: z.coerce.number(),
  assetId: z.string().nonempty("Required"),
});

export const updateInspectionRoutePointSchema = createInspectionRoutePointSchema
  .partial()
  .extend({ id: z.string() });

export const resolveAlertSchema = z.object({
  resolutionNote: z.string().nonempty(),
});
export const resolveAlertSchemaResolver = zodResolver(resolveAlertSchema);

export const setupAssetSchema = z.object({
  id: z.string().nonempty(),
  setupOn: z.coerce.date().optional(),
  setupQuestionResponses: z.object({
    createMany: z.object({
      data: z.array(createAssetQuestionResponseSchema),
    }),
    updateMany: z.array(
      z.object({
        where: z.object({ id: z.string() }),
        data: createAssetQuestionResponseSchema,
      })
    ),
  }),
});

export const buildSetupAssetSchema = (
  questions: AssetQuestion[],
  questionResponses: AssetQuestionResponse[]
) => {
  return setupAssetSchema.extend({
    setupQuestionResponses: z.object({
      createMany: z.object({
        data: z.tuple(
          questions
            .filter(
              (q) =>
                !questionResponses.find((qr) => qr.assetQuestionId === q.id)
            )
            .map((q) =>
              createAssetQuestionResponseSchema.extend({
                value: buildZodTypeFromQuestion(q),
              })
            ) as unknown as [z.ZodTypeAny, ...z.ZodTypeAny[]]
        ),
      }),
      updateMany: z.tuple(
        questions
          .map((q) => [
            q,
            questionResponses.find((qr) => qr.assetQuestionId === q.id),
          ])
          .filter(
            (el): el is [AssetQuestion, AssetQuestionResponse] =>
              el[1] !== undefined
          )
          .map(([q, qr]) =>
            z.object({
              where: z.object({ id: z.literal(qr.id) }),
              data: createAssetQuestionResponseSchema.extend({
                value: buildZodTypeFromQuestion(q),
              }),
            })
          ) as unknown as [z.ZodTypeAny, ...z.ZodTypeAny[]]
      ),
    }),
  });
};

// Admin interactions
export const createRoleSchema = z.object({
  name: z.string().nonempty(),
  description: z.string().optional(),
});
export const createRoleSchemaResolver = zodResolver(createRoleSchema);

export const updateRoleSchema = createRoleSchema.partial();
export const updateRoleSchemaResolver = zodResolver(updateRoleSchema);

const permissionToUpdateSchema = z.object({
  id: z.string().nonempty(),
  name: z.string().nonempty(),
});

export const updatePermissionMappingSchema = z.object({
  grant: z.array(permissionToUpdateSchema),
  revoke: z.array(permissionToUpdateSchema),
});
export const updatePermissionMappingSchemaResolver = zodResolver(
  updatePermissionMappingSchema
);

export const globalSettingsSchema = z.object({
  systemEmailFromAddress: fromAddressSchema,
  productRequestToAddress: z.string().email(),
});

export const createVaultOwnershipSchema = z.object({
  key: z.string().nonempty(),
  bucketName: z.string().optional(),
  accessType: z.enum(VaultAccessTypes).optional(),
});

export const updateVaultOwnershipSchema = createVaultOwnershipSchema.partial();

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
