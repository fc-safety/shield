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
      productId: string,
      input: z.infer<typeof createAssetQuestionSchema>
    ) =>
      authenticatedData<AssetQuestion>(request, [
        FetchOptions.url("/product-categories/:id/questions", { id: productId })
          .post()
          .json(input)
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
