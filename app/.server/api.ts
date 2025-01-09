import {
  type Asset,
  type Client,
  type Manufacturer,
  type Product,
  type ProductCategory,
  type Site,
  type Tag,
} from "~/lib/models";
import type {
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
import { CRUD } from "./api-utils";

export const api = {
  // ASSETS
  assets: CRUD.for<Asset, typeof createAssetSchema, typeof updateAssetSchema>(
    "/assets"
  ).all(),
  tags: CRUD.for<Tag, typeof createTagSchema, typeof updateTagSchema>(
    "/tags"
  ).all(),

  // PRODUCTS
  products: CRUD.for<
    Product,
    typeof createProductSchema,
    typeof updateProductSchema
  >("/products").all(),
  manufacturers: CRUD.for<
    Manufacturer,
    typeof createManufacturerSchema,
    typeof updateManufacturerSchema
  >("/manufacturers").all(),
  productCategories: CRUD.for<
    ProductCategory,
    typeof createProductCategorySchema,
    typeof updateProductCategorySchema
  >("/product-categories").all(),

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
