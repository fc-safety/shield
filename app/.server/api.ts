import { z } from "zod";
import {
  type Alert,
  type Asset,
  type AssetQuestion,
  type Client,
  type Inspection,
  type Manufacturer,
  type Product,
  type ProductCategory,
  type Site,
  type Tag,
} from "~/lib/models";
import {
  createInspectionSchema,
  resolveAlertSchema,
  type baseSiteSchema,
  type createAssetQuestionSchema,
  type createAssetSchema,
  type createClientSchema,
  type createManufacturerSchema,
  type createProductCategorySchema,
  type createProductSchema,
  type createTagSchema,
  type setupAssetSchema,
  type updateAssetQuestionSchema,
  type updateAssetSchema,
  type updateClientSchema,
  type updateManufacturerSchema,
  type updateProductCategorySchema,
  type updateProductSchema,
  type updateTagSchema,
} from "~/lib/schema";
import { authenticatedData, CRUD, FetchOptions } from "./api-utils";

const backendCreateInspectionSchema = createInspectionSchema.extend({
  useragent: z.string(),
  ipv4: z.string().ip({ version: "v4" }).optional(),
  ipv6: z.string().ip({ version: "v6" }).optional(),
});

export const api = {
  // ASSETS
  assets: {
    ...CRUD.for<Asset, typeof createAssetSchema, typeof updateAssetSchema>(
      "/assets"
    ).all(),

    // Asset setup questions
    setup: (request: Request, input: z.infer<typeof setupAssetSchema>) => {
      return authenticatedData<Asset>(request, [
        FetchOptions.url("/assets/:id/setup", { id: input.id })
          .post()
          .json(input)
          .build(),
      ]);
    },
    updateSetup: (
      request: Request,
      input: z.infer<typeof setupAssetSchema>
    ) => {
      return authenticatedData<Asset>(request, [
        FetchOptions.url("/assets/:id/setup", { id: input.id })
          .patch()
          .json(input)
          .build(),
      ]);
    },

    // Alerts
    alerts: (assetId: string) => ({
      ...CRUD.for<Alert, never, never>(`/assets/${assetId}/alerts`).only([
        "get",
        "list",
      ]),
      resolve: (
        request: Request,
        alertId: string,
        input: z.infer<typeof resolveAlertSchema>
      ) => {
        return authenticatedData<Alert>(request, [
          FetchOptions.url(`/assets/${assetId}/alerts/${alertId}/resolve`)
            .post()
            .json(input)
            .build(),
        ]);
      },
    }),
  },
  tags: {
    ...CRUD.for<Tag, typeof createTagSchema, typeof updateTagSchema>(
      "/tags"
    ).all(),
    getBySerial: (request: Request, serialNumber: string) =>
      authenticatedData<Tag>(request, [
        FetchOptions.url("/tags/serial/:serialNumber", { serialNumber })
          .get()
          .build(),
      ]),
  },
  inspections: {
    ...CRUD.for<Inspection, typeof backendCreateInspectionSchema, never>(
      "/inspections"
    ).except(["delete", "deleteAndRedirect", "update"]),
  },

  // PRODUCTS
  products: {
    ...CRUD.for<
      Product,
      typeof createProductSchema,
      typeof updateProductSchema
    >("/products").all(),
    addQuestion: (
      request: Request,
      productId: string,
      input: z.infer<typeof createAssetQuestionSchema>
    ) =>
      authenticatedData<AssetQuestion>(request, [
        FetchOptions.url("/products/:id/questions", { id: productId })
          .post()
          .json(input)
          .build(),
      ]),
    updateQuestion: (
      request: Request,
      productId: string,
      questionId: string,
      input: z.infer<typeof updateAssetQuestionSchema>
    ) =>
      authenticatedData<AssetQuestion>(request, [
        FetchOptions.url("/products/:id/questions/:questionId", {
          id: productId,
          questionId,
        })
          .patch()
          .json(input)
          .build(),
      ]),
    deleteQuestion: (request: Request, productId: string, questionId: string) =>
      authenticatedData<AssetQuestion>(request, [
        FetchOptions.url("/products/:id/questions/:questionId", {
          id: productId,
          questionId,
        })
          .delete()
          .build(),
      ]),
  },
  manufacturers: CRUD.for<
    Manufacturer,
    typeof createManufacturerSchema,
    typeof updateManufacturerSchema
  >("/manufacturers").all(),
  productCategories: {
    ...CRUD.for<
      ProductCategory,
      typeof createProductCategorySchema,
      typeof updateProductCategorySchema
    >("/product-categories").all(),
    addQuestion: (
      request: Request,
      categoryId: string,
      input: z.infer<typeof createAssetQuestionSchema>
    ) =>
      authenticatedData<AssetQuestion>(request, [
        FetchOptions.url("/product-categories/:id/questions", {
          id: categoryId,
        })
          .post()
          .json(input)
          .build(),
      ]),
    updateQuestion: (
      request: Request,
      categoryId: string,
      questionId: string,
      input: z.infer<typeof updateAssetQuestionSchema>
    ) =>
      authenticatedData<AssetQuestion>(request, [
        FetchOptions.url("/product-categories/:id/questions/:questionId", {
          id: categoryId,
          questionId,
        })
          .patch()
          .json(input)
          .build(),
      ]),
    deleteQuestion: (request: Request, productId: string, questionId: string) =>
      authenticatedData<AssetQuestion>(request, [
        FetchOptions.url("/product-categories/:id/questions/:questionId", {
          id: productId,
          questionId,
        })
          .delete()
          .build(),
      ]),
  },

  // CLIENTS & SITES
  clients: CRUD.for<
    Client,
    typeof createClientSchema,
    typeof updateClientSchema
  >("/clients").all(),
  sites: CRUD.for<Site, typeof baseSiteSchema, typeof baseSiteSchema>(
    "/sites"
  ).except(["list"]),
};
