import { z } from "zod";
import {
  type Alert,
  type Asset,
  type AssetQuestion,
  type Client,
  type Inspection,
  type InspectionRoute,
  type InspectionSession,
  type Manufacturer,
  type Product,
  type ProductCategory,
  type ProductRequest,
  type Site,
  type Tag,
} from "~/lib/models";
import {
  createInspectionRouteSchema,
  createInspectionSchema,
  createProductRequestSchema,
  createRoleSchema,
  resolveAlertSchema,
  updateInspectionRouteSchema,
  updateRoleSchema,
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
import type { ClientUser, Role } from "~/lib/types";
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
  },
  alerts: {
    ...CRUD.for<Alert, never, never>("/alerts").only(["get", "list"]),
    resolve: (
      request: Request,
      id: string,
      input: z.infer<typeof resolveAlertSchema>
    ) => {
      return authenticatedData<Alert>(request, [
        FetchOptions.url(`/alerts/${id}/resolve`).post().json(input).build(),
      ]);
    },
  },
  tags: {
    ...CRUD.for<Tag, typeof createTagSchema, typeof updateTagSchema>(
      "/tags"
    ).all(),
    getByExternalId: (request: Request, externalId: string) =>
      authenticatedData<Tag>(request, [
        FetchOptions.url("/tags/externalId/:externalId", { externalId })
          .get()
          .build(),
      ]),
  },
  inspections: {
    ...CRUD.for<
      Inspection,
      typeof backendCreateInspectionSchema,
      never,
      {
        inspection: Inspection;
        session: InspectionSession | null;
      }
    >("/inspections").except(["delete", "deleteAndRedirect", "update"]),
    getSession: (request: Request, id: string) =>
      authenticatedData<InspectionSession>(request, [
        FetchOptions.url("/inspections/sessions/:id", { id }).get().build(),
      ]),
    getActiveSessionsForAsset: (request: Request, assetId: string) =>
      authenticatedData<InspectionSession[]>(request, [
        FetchOptions.url("/inspections/active-sessions/asset/:assetId", {
          assetId,
        })
          .get()
          .build(),
      ]),
  },
  inspectionRoutes: {
    ...CRUD.for<
      InspectionRoute,
      typeof createInspectionRouteSchema,
      typeof updateInspectionRouteSchema
    >("/inspection-routes").all(),
    getForAssetId: (request: Request, assetId: string) =>
      authenticatedData<InspectionRoute[]>(request, [
        FetchOptions.url("/inspection-routes/asset/:assetId", { assetId })
          .get()
          .build(),
      ]),
  },
  productRequests: {
    ...CRUD.for<ProductRequest, typeof createProductRequestSchema, never>(
      "/product-requests"
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
  clients: {
    ...CRUD.for<Client, typeof createClientSchema, typeof updateClientSchema>(
      "/clients"
    ).all(),
    users: (clientId: string) =>
      CRUD.for<ClientUser, never, never>(`/clients/${clientId}/users`).all(),
  },
  sites: CRUD.for<Site, typeof baseSiteSchema, typeof baseSiteSchema>(
    "/sites"
  ).except(["list"]),

  // Other ADMIN
  roles: CRUD.for<Role, typeof createRoleSchema, typeof updateRoleSchema>(
    "/roles"
  ).all(),
};
