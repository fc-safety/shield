import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { GENERIC_MANUFACTURER_NAME } from "./constants";
import {
  AssetQuestionConditionTypes,
  AssetQuestionResponseTypes,
  AssetQuestionTypes,
  ClientStatuses,
  InspectionStatuses,
  ProductRequestStatuses,
  ProductTypes,
  VaultAccessTypes,
  type AssetQuestion,
  type AssetQuestionResponse,
  type AssetQuestionResponseType,
  type AssetQuestionType,
} from "./models";
import type { ResponseValueImage } from "./types";
import { isNil } from "./utils";

export const addressSchema = z.object({
  id: z.string().optional(),
  street1: z.string().nonempty("Address line 1 is required."),
  street2: z
    .nullable(z.string())
    .optional()
    .transform((street2) => street2 || undefined),
  city: z.nullable(z.string().nonempty("City is required.")),
  state: z.nullable(
    z
      .string()
      .min(2, "State must be 2 characters (e.g. CA).")
      .transform((state) => state.toUpperCase())
  ),
  zip: z.nullable(z.string().length(5, "Zip code must be 5 digits.")),
  county: z.nullable(z.string().optional()),
  country: z.nullable(z.string().optional()),
});

export const createRegulatoryCodeSchema = z.object({
  active: z.boolean().default(true),
  codeIdentifier: z.string().nonempty("Code identifier is required."),
  title: z.string().optional(),
  section: z.string().optional(),
  governingBody: z.string().nonempty("Governing body is required."),
  sourceUrl: z.preprocess((url) => url || undefined, z.url().optional()).optional(),
  documentVersion: z.string().optional(),
});

export const updateRegulatoryCodeSchema = createRegulatoryCodeSchema.partial().extend({
  id: z.string(),
});

export const optionalConnectSchema = z
  .object({
    connect: z.object({
      id: z.string().optional(),
    }),
  })
  .optional()
  .transform((v) => (v?.connect.id ? v : undefined));

export const optionalConnectOrCreateSchema = <S extends z.Schema>(createSchema: S) =>
  z
    .object({
      connect: z.object({
        id: z.string().optional(),
      }),
      create: createSchema,
      disconnect: z.boolean(),
    })
    .partial()
    .transform(
      (
        v
      ):
        | {
            connect?: { id: string };
            create?: z.infer<S>;
            disconnect?: boolean;
          }
        | undefined => {
        if (v.create !== undefined) {
          return {
            create: v.create,
          };
        }

        if (v.disconnect !== undefined) {
          return {
            disconnect: v.disconnect,
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
  .transform((v): { connect?: { id: string }; disconnect?: boolean } | undefined => {
    if (v.disconnect !== undefined) {
      return {
        disconnect: v.disconnect,
      };
    }

    return v.connect?.id ? { connect: { id: v.connect.id } } : undefined;
  });

export const fromAddressSchema = z.union([
  z.email(),
  z.string().regex(/^[A-Za-z0-9\s]+\s<[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}>$/),
]);

export const createFileSchema = z.object({
  name: z.string().nonempty("Name is required."),
  url: z.url().nonempty(),
});

export const updateFileSchema = createFileSchema.partial().extend({
  id: z.string(),
});

export const createClientSchema = z.object({
  legacyClientId: z.string().nullable().optional(),
  externalId: z
    .string()
    .length(24)
    .optional()
    .transform((id) => id || undefined),
  name: z.string().nonempty(),
  startedOn: z.iso.datetime(),
  address: z.object({
    create: addressSchema,
  }),
  status: z.enum(ClientStatuses).optional(),
  phoneNumber: z.string().regex(/^(\+1)?\d{10}$/, "Phone must include 10 digit number."),
  homeUrl: z
    .nullable(z.string())
    .optional()
    .transform((url) => url || undefined),
  defaultInspectionCycle: z.coerce.number<number>().default(30),
  demoMode: z.boolean().optional(),
});

export const updateClientSchema = createClientSchema
  .omit({ externalId: true })
  .extend({
    id: z.string(),
    address: z.object({ update: addressSchema.partial() }),
  })
  .partial();

export const baseSiteSchema = z.object({
  id: z.string().optional(),
  legacySiteId: z.string().nullable().optional(),
  legacyGroupId: z.string().nullable().optional(),
  externalId: z
    .union([z.string().length(24), z.string().length(0)])
    .optional()
    .transform((id) => id || undefined),
  primary: z.boolean().default(false),
  active: z.boolean().default(true),
  name: z.string(),
  address: z
    .object({
      create: addressSchema,
      update: addressSchema.partial(),
    })
    .partial(),
  phoneNumber: z.string().regex(/^(\+1)?\d{10}$/, "Phone must include 10 digit number."),
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
  const schema = baseSiteSchema.extend({
    address: baseSiteSchema.shape.address.required(create ? { create: true } : { update: true }),
    subsites: !isSiteGroup
      ? baseSiteSchema.shape.subsites.unwrap().partial().optional()
      : baseSiteSchema.shape.subsites.unwrap().required(create ? { connect: true } : { set: true }),
  });

  if (create) {
    return schema;
  }
  return schema.partial();
};

export const createUserSchema = z.object({
  legacyUserId: z.string().nullable().optional(),
  active: z.boolean().optional(),
  firstName: z.string().nonempty(),
  lastName: z.string().nonempty(),
  email: z.email(),
  phoneNumber: z
    .string()
    .regex(/^(\+1)?\d{10}$/, "Phone must include 10 digit number.")
    .optional(),
  position: z.string().optional(),
  siteExternalId: z.string().nonempty(),
});

export const updateUserSchema = createUserSchema.partial();

export const assignUserRoleSchema = z.object({
  roleId: z.string().nonempty(),
});

// Add a role to a user (multi-role support)
export const addUserRoleSchema = z.object({
  roleId: z.string().nonempty(),
});

export const createProductCategorySchema = z.object({
  id: z.string().optional(),
  legacyCategoryId: z.string().nullable().optional(),
  active: z.boolean(),
  name: z.string().nonempty(),
  shortName: z.string().optional(),
  description: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  client: disconnectableSchema.optional(),
});

export const updateProductCategorySchema = createProductCategorySchema
  .extend({ id: z.string() })
  .partial();

export const createManufacturerSchema = z.object({
  id: z.string().optional(),
  legacyManufacturerId: z.string().nullable().optional(),
  active: z.boolean(),
  name: z
    .string()
    .nonempty()
    .refine((name) => name.toLowerCase() !== GENERIC_MANUFACTURER_NAME.toLowerCase(), {
      message: "Manufacturer name cannot be generic.",
    }),
  homeUrl: z.string().optional(),
  client: disconnectableSchema.optional(),
});

export const updateManufacturerSchema = createManufacturerSchema
  .extend({ id: z.string() })
  .partial();

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
  legacyProductId: z.string().nullable().optional(),
  legacyConsumableId: z.string().nullable().optional(),
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
  client: disconnectableSchema.optional(),
  metadata: z.record(z.string().nonempty(), z.string().nonempty()).optional(),
  parentProduct: optionalConnectSchema,
  displayExpirationDate: z.boolean().optional(),
  ansiCategory: optionalConnectOrCreateSchema(createAnsiCategorySchema).optional(),
});

export const updateProductSchema = createProductSchema.extend({ id: z.string() }).partial();

export const createTagSchema = z.object({
  id: z.string().optional(),
  legacyTagId: z.string().nullable().optional(),
  serialNumber: z.string().nonempty(),
  externalId: z.string().optional(),
  asset: optionalConnectSchema,
  site: optionalConnectSchema,
  client: optionalConnectSchema,
});

export const updateTagSchema = createTagSchema
  .extend({
    id: z.string(),
    client: disconnectableSchema,
    site: disconnectableSchema,
    asset: disconnectableSchema,
  })
  .partial();

export const registerTagSchema = z.object({
  client: optionalConnectSchema,
  site: optionalConnectSchema,
  asset: z.object({
    connect: z.object({
      id: z.string().nonempty(),
    }),
  }),
});

export const createAssetSchema = z.object({
  legacyAssetId: z.string().nullable().optional(),
  active: z.boolean(),
  name: z.string().default(""),
  location: z.string().nonempty(),
  placement: z.string().nonempty(),
  serialNumber: z.string().nonempty(),
  inspectionCycle: z.coerce.number<number>().nullable().optional(),
  product: z.object({
    connect: z.object({
      id: z.string(),
    }),
  }),
  metadata: z.record(z.string().nonempty(), z.string().nonempty()).optional(),
  site: optionalConnectSchema,
  client: optionalConnectSchema,
});

export const updateAssetSchema = createAssetSchema.extend({ id: z.string() }).partial();

export const createConsumableSchema = z.object({
  legacyInventoryId: z.string().nullable().optional(),
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
  quantity: z.coerce.number<number>().gte(1).optional(),
  expiresOn: z
    .union([z.iso.datetime(), z.literal("")])
    .optional()
    .nullable()
    .transform((value) => value || null),
  site: optionalConnectSchema,
});

export const updateConsumableSchema = createConsumableSchema.extend({ id: z.string() }).partial();

export const createProductRequestItemSchema = z.object({
  productId: z.string(),
  quantity: z.coerce.number<number>().gte(1),
});

export const createProductRequestSchema = z.object({
  legacyRequestId: z.string().nullable().optional(),
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
    beforeDaysPast: z.coerce.number<number>(),
    afterDaysPast: z.coerce.number<number>(),
    beforeDaysFuture: z.coerce.number<number>(),
    afterDaysFuture: z.coerce.number<number>(),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    error: "At least one operator is required",
  });

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
  baseCreateAssetAlertCriterionRuleSchema
    .extend({
      AND: z.array(baseCreateAssetAlertCriterionRuleSchema).optional(),
      OR: z.array(baseCreateAssetAlertCriterionRuleSchema).optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      error: "At least one rule is required",
    });

export const createAssetAlertCriterionSchema = z.object({
  rule: createAssetAlertCriterionRuleSchema,
  alertLevel: z.enum(["CRITICAL", "URGENT", "WARNING", "INFO", "AUDIT"]),
  autoResolve: z.boolean().default(false),
});

export const updateAssetAlertCriterionSchema = createAssetAlertCriterionSchema
  .extend({ id: z.string() })
  .partial();

export const createConsumableConfigSchema = z.object({
  consumableProduct: z.object({
    connect: z.object({
      id: z.string().nonempty(),
    }),
  }),
  mappingType: z.enum(["EXPIRATION_DATE"]),
});

export const createAssetQuestionConditionSchema = z.object({
  conditionType: z.enum(AssetQuestionConditionTypes),
  value: z.array(z.string()),
  description: z.string().optional(),
});

export const updateAssetQuestionConditionSchema = createAssetQuestionConditionSchema.extend({
  id: z.string(),
});

export const createSetAssetMetadataConfigSchema = z.object({
  metadata: z.array(
    z
      .object({
        key: z.string().nonempty(),
        type: z.enum(["DYNAMIC", "STATIC"]),
        value: z.string().optional(),
      })
      .refine((data) => (data.type === "STATIC" ? !!data.value && data.value !== "" : true), {
        message: "Value is required for setting static metadata",
      })
  ),
});

export const baseCreateAssetQuestionSchema = z.object({
  legacyQuestionId: z.string().nullable().optional(),
  active: z.boolean().default(true),
  type: z.enum(AssetQuestionTypes),
  required: z.boolean().default(false),
  order: z.coerce.number<number>().optional(),
  prompt: z.string().nonempty(),
  valueType: z.enum(AssetQuestionResponseTypes),
  selectOptions: z
    .array(
      z.object({
        value: z.string(),
        order: z.number().optional(),
        label: z.string().optional(),
      })
    )
    .optional(),
  helpText: z.string().optional(),
  placeholder: z.string().optional(),
  tone: z.string().optional(),
  client: disconnectableSchema.optional(),
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
  conditions: z.object({
    createMany: z.object({
      data: z
        .array(createAssetQuestionConditionSchema)
        .min(1, "At least one condition is required"),
    }),
  }),
  files: z
    .object({
      createMany: z.object({
        data: z.array(createFileSchema),
      }),
    })
    .optional(),
  setAssetMetadataConfig: z
    .object({
      create: createSetAssetMetadataConfigSchema,
    })
    .optional(),
  regulatoryCodes: z
    .object({
      create: z.array(createRegulatoryCodeSchema),
    })
    .optional(),
});

const refineAssetQuestionSchema = (
  question: {
    valueType?: AssetQuestionResponseType;
    selectOptions?: {
      value: string;
      order?: number;
      label?: string;
    }[];
    setAssetMetadataConfig?: {
      create?: z.infer<typeof createSetAssetMetadataConfigSchema>;
      update?: z.infer<typeof createSetAssetMetadataConfigSchema>;
      delete?: boolean;
    };
    type?: AssetQuestionType;
  },
  ctx: z.RefinementCtx
) => {
  if (
    question.valueType === "SELECT" &&
    (!question.selectOptions ||
      question.selectOptions.length === 0 ||
      !question.selectOptions.every((option) => option.value))
  ) {
    ctx.addIssue({
      code: "custom",
      message: "Select options are required for select questions",
      path: ["selectOptions"],
    });
  }

  if (question.type === "CONFIGURATION") {
    const metadataConfig = {
      metadata: [
        ...(question.setAssetMetadataConfig?.create?.metadata ?? []),
        ...(question.setAssetMetadataConfig?.update?.metadata ?? []),
      ],
    };
    if (metadataConfig.metadata.length === 0) {
      ctx.addIssue({
        code: "custom",
        message: "At least one metadata setter is required for configuration questions",
        path: ["setAssetMetadataConfig.create.metadata"],
      });
    }
  }
};

export const createAssetQuestionSchema = baseCreateAssetQuestionSchema
  .extend({
    variants: z
      .object({
        createMany: z.object({
          data: z.array(baseCreateAssetQuestionSchema),
        }),
      })
      .optional(),
  })
  .superRefine(refineAssetQuestionSchema);

export const updateAssetQuestionSchema = baseCreateAssetQuestionSchema
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
    conditions: z
      .object({
        createMany: z.object({
          data: z.array(createAssetQuestionConditionSchema),
        }),
        updateMany: z.array(
          z.object({
            where: z.object({ id: z.string() }),
            data: updateAssetQuestionConditionSchema,
          })
        ),
        deleteMany: z.array(z.object({ id: z.string() })),
      })
      .partial()
      .optional(),
    variants: z
      .object({
        createMany: z.object({
          data: z.array(baseCreateAssetQuestionSchema),
        }),
        updateMany: z.array(
          z.object({
            where: z.object({ id: z.string() }),
            data: baseCreateAssetQuestionSchema.partial(),
          })
        ),
        deleteMany: z.array(z.object({ id: z.string() })),
      })
      .optional(),
    files: z
      .object({
        createMany: z.object({
          data: z.array(createFileSchema),
        }),
        updateMany: z.array(
          z.object({ where: z.object({ id: z.string() }), data: updateFileSchema })
        ),
        deleteMany: z.array(z.object({ id: z.string() })),
      })
      .partial()
      .optional(),
    regulatoryCodes: z
      .object({
        create: z.array(createRegulatoryCodeSchema),
        update: z.array(
          z.object({
            where: z.object({ id: z.string() }),
            data: updateRegulatoryCodeSchema,
          })
        ),
        delete: z.array(z.object({ id: z.string() })),
      })
      .partial()
      .optional(),
    setAssetMetadataConfig: z
      .object({
        create: createSetAssetMetadataConfigSchema,
        update: createSetAssetMetadataConfigSchema,
        delete: z.boolean().default(false),
      })
      .partial()
      .optional(),
  })
  .superRefine(refineAssetQuestionSchema);

export const responseValueImageSchema = z.object({
  urls: z.array(z.string()),
}) satisfies z.Schema<ResponseValueImage>;

export const createAssetQuestionResponseSchema = z.object({
  id: z.string().optional(),
  value: z.union([z.string(), z.number(), responseValueImageSchema]),
  originalPrompt: z.string(),
  assetQuestionId: z.string().nonempty(),
});
export const createAssetQuestionResponseSchemaResolver = zodResolver(
  createAssetQuestionResponseSchema
);

export const createInspectionSchema = z.object({
  legacyLogId: z.string().nullable().optional(),
  asset: z.object({
    connect: z.object({
      id: z.string().nonempty(),
    }),
  }),
  status: z.enum(InspectionStatuses),
  latitude: z.number().gte(-90).lte(90),
  longitude: z.number().gte(-180).lte(180),
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
      z.string().nonempty("This question is required."),
      z.number().int(),
      z.object({
        urls: z.array(z.string()).min(1),
      }),
    ]);
  }

  return z.union([z.string(), z.number().int()]);
};

const buildQuestionResponseValidator =
  (questions: AssetQuestion[], existingResponseIds: string[] = []) =>
  (
    responses: (
      | z.infer<typeof createAssetQuestionResponseSchema>
      | { where: { id: string }; data: z.infer<typeof createAssetQuestionResponseSchema> }
    )[],
    ctx: z.RefinementCtx
  ) => {
    if (responses.length < questions.filter((q) => q.required).length) {
      ctx.addIssue({
        code: "custom",
        message: `Expected ${questions.length} responses, got ${responses.length}`,
        path: [],
      });
      return;
    }
    responses.forEach((responseOrData, i) => {
      if ("where" in responseOrData) {
        const existingResponseId = existingResponseIds.at(i);
        if (isNil(existingResponseId)) {
          ctx.addIssue({
            code: "custom",
            message: `No matching response found for question ${questions[i].id}`,
            path: [i, "where", "id"],
          });
        } else if (existingResponseId !== responseOrData.where.id) {
          ctx.addIssue({
            code: "custom",
            message: `Expected response id ${existingResponseId}, got ${responseOrData.where.id}`,
            path: [i, "where", "id"],
          });
        }
      }
      const response = "data" in responseOrData ? responseOrData.data : responseOrData;
      const question = questions[i];
      const valueSchema = buildZodTypeFromQuestion(question);
      const valueResult = valueSchema.safeParse(response.value);
      if (!valueResult.success) {
        valueResult.error.issues.forEach((issue) => {
          ctx.addIssue({
            ...issue,
            path: [i, "value", ...(issue.path ?? [])],
          });
        });
      }
    });
  };

export const buildConfigureAssetSchema = (questions: AssetQuestion[]) => {
  return z.object({
    responses: z
      .array(createAssetQuestionResponseSchema)
      .superRefine(buildQuestionResponseValidator(questions)),
  });
};

/**
 * Builds a Zod schema for inspection creation, dynamically validating each response
 * according to the corresponding question's requirements.
 *
 * @param questions - The list of asset questions to build validation for.
 * @returns A Zod schema for inspection creation with per-question response validation.
 */
export const buildInspectionSchema = (questions: AssetQuestion[]) => {
  return createInspectionSchema.extend({
    responses: z.object({
      createMany: z.object({
        data: z
          .array(createAssetQuestionResponseSchema)
          .superRefine(buildQuestionResponseValidator(questions)),
      }),
    }),
  });
};

export const createInspectionRouteSchema = z.object({
  id: z.string().optional(),
  name: z.string().nonempty(),
  description: z.string().optional(),
  inspectionRoutePoints: z.array(
    z.object({
      order: z.coerce.number<number>(),
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
  order: z.coerce.number<number>(),
  assetId: z.string().nonempty("Required"),
});

export const updateInspectionRoutePointSchema = createInspectionRoutePointSchema
  .partial()
  .extend({ id: z.string() });

export const resolveAlertSchema = z.object({
  resolutionNote: z.string().nonempty(),
});

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
  const newQuestions: AssetQuestion[] = [];
  const updateQuestions: AssetQuestion[] = [];
  const orderedQuestionResponses: AssetQuestionResponse[] = [];

  questions.forEach((q) => {
    const existingResponse = questionResponses.find((qr) => qr.assetQuestionId === q.id);
    if (existingResponse) {
      updateQuestions.push(q);
      orderedQuestionResponses.push(existingResponse);
    } else {
      newQuestions.push(q);
    }
  });

  return setupAssetSchema.extend({
    setupQuestionResponses: z.object({
      createMany: z.object({
        data: z
          .array(createAssetQuestionResponseSchema)
          .superRefine(buildQuestionResponseValidator(newQuestions)),
      }),
      updateMany: z
        .array(
          z.object({
            where: z.object({ id: z.string() }),
            data: createAssetQuestionResponseSchema,
          })
        )
        .superRefine(
          buildQuestionResponseValidator(
            updateQuestions,
            orderedQuestionResponses.map((qr) => qr.id)
          )
        ),
    }),
  });
};

// Admin interactions
export const roleScopeSchema = z.enum(["SYSTEM", "GLOBAL", "CLIENT", "SITE_GROUP", "SITE", "SELF"]);

export const createRoleSchema = z.object({
  name: z.string().nonempty(),
  description: z.string().optional(),
  scope: roleScopeSchema.default("SITE"),
  clientAssignable: z.boolean().default(false),
});

export const updateRoleSchema = createRoleSchema.partial();

const permissionToUpdateSchema = z.object({
  id: z.string().nonempty(),
  name: z.string().nonempty(),
});

export const updatePermissionMappingSchema = z.object({
  grant: z.array(permissionToUpdateSchema),
  revoke: z.array(permissionToUpdateSchema),
});

export const globalSettingsSchema = z.object({
  systemEmailFromAddress: fromAddressSchema,
  productRequestToAddress: z.email(),
  landingFormLeadToAddress: z.email(),
});

export const createVaultOwnershipSchema = z.object({
  key: z.string().nonempty(),
  bucketName: z.string().optional(),
  accessType: z.enum(VaultAccessTypes).optional(),
});

export const updateVaultOwnershipSchema = createVaultOwnershipSchema.partial();

// Invitation schemas
export const createInvitationSchema = z.object({
  clientId: z.string().optional(),
  email: z.email({ message: "A valid email address is required" }),
  roleId: z.string({ message: "Role is required" }).nonempty("Role is required"),
  siteId: z.string({ message: "Site is required" }).nonempty("Site is required"),
  expiresInDays: z.coerce.number().min(1).max(30).default(7),
});

export const acceptInvitationSchema = z.object({
  code: z.string().nonempty(),
});
