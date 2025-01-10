import type { z } from "zod";
import {
  type Asset,
  type AssetQuestion,
  type Client,
  type Manufacturer,
  type Product,
  type ProductCategory,
  type Site,
  type Tag,
} from "~/lib/models";
import type {
  createAssetQuestionSchema,
  createAssetSchema,
  createClientSchema,
  createManufacturerSchema,
  createProductCategorySchema,
  createProductSchema,
  createSiteSchema,
  createTagSchema,
  updateAssetQuestionSchema,
  updateAssetSchema,
  updateClientSchema,
  updateManufacturerSchema,
  updateProductCategorySchema,
  updateProductSchema,
  updateSiteSchema,
  updateTagSchema,
} from "~/lib/schema";
import { authenticatedData, CRUD, FetchOptions } from "./api-utils";

export const api = {
  // ASSETS
  assets: CRUD.for<Asset, typeof createAssetSchema, typeof updateAssetSchema>(
    "/assets"
  ).all(),
  tags: CRUD.for<Tag, typeof createTagSchema, typeof updateTagSchema>(
    "/tags"
  ).all(),

  // PRODUCTS
  products: {
    ...CRUD.for<
      Product,
      typeof createProductSchema,
      typeof updateProductSchema
    >("/products").all(),
    addQuestion: async (
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
    updateQuestion: async (
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
    deleteQuestion: async (
      request: Request,
      productId: string,
      questionId: string
    ) =>
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
    addQuestion: async (
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
    updateQuestion: async (
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
    deleteQuestion: async (
      request: Request,
      productId: string,
      questionId: string
    ) =>
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
  sites: CRUD.for<Site, typeof createSiteSchema, typeof updateSiteSchema>(
    "/sites"
  ).except(["list"]),
};
