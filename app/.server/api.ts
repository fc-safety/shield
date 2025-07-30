import { z } from "zod";
import {
  type Alert,
  type AnsiCategory,
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
  type SettingsBlock,
  type Site,
  type Tag,
  type VaultOwnership,
} from "~/lib/models";
import {
  createInspectionSchema,
  createTagSchema,
  createVaultOwnershipSchema,
  globalSettingsSchema,
  resolveAlertSchema,
  type setupAssetSchema,
} from "~/lib/schema";
import type { ClientUser, GetReportResult, ListReportsResult, Role } from "~/lib/types";
import type { QueryParams } from "~/lib/urls";
import { INSPECTION_TOKEN_HEADER } from "~/routes/inspect/constants/headers";
import { ApiFetcher, CRUD, type FetchBuildOptions } from "./api-utils";

const backendCreateInspectionSchema = createInspectionSchema.extend({
  useragent: z.string(),
  ipv4: z.string().ip({ version: "v4" }).optional(),
  ipv6: z.string().ip({ version: "v6" }).optional(),
});

export const api = {
  // ASSETS
  assets: {
    ...CRUD.for<Asset>("/assets").all(),

    // Asset setup questions
    setup: (request: Request, input: z.infer<typeof setupAssetSchema>) =>
      ApiFetcher.create(request, "/assets/:id/setup", { id: input.id }).json(input).post<Asset>(),
    updateSetup: (request: Request, input: z.infer<typeof setupAssetSchema>) =>
      ApiFetcher.create(request, "/assets/:id/setup", { id: input.id }).json(input).patch<Asset>(),
  },
  alerts: {
    ...CRUD.for<Alert>("/alerts"),
    resolve: (request: Request, id: string, input: z.infer<typeof resolveAlertSchema>) =>
      ApiFetcher.create(request, `/alerts/${id}/resolve`, { id }).json(input).post<Alert>(),
  },
  tags: {
    ...CRUD.for<Tag>("/tags").all(),
    create: (request: Request, input: z.infer<typeof createTagSchema>) =>
      ApiFetcher.create(request, "/tags").json(input).post<Tag>(),
    getForInspection: (request: Request, externalId: string) =>
      ApiFetcher.create(request, "/tags/for-inspection/:externalId", {
        externalId,
      }).get<Tag>(),
    checkRegistration: (request: Request, inspectionToken: string) =>
      ApiFetcher.create(request, "/tags/check-registration")
        .setHeader(INSPECTION_TOKEN_HEADER, inspectionToken)
        .get<Tag>(),
    getForAssetSetup: (request: Request, externalId: string) =>
      ApiFetcher.create(request, "/tags/for-asset-setup/:externalId", {
        externalId,
      }).get<Tag>(),
  },
  inspections: {
    ...CRUD.for<Inspection>("/inspections").all(),
    create: (
      request: Request,
      input: z.infer<typeof backendCreateInspectionSchema>,
      options: FetchBuildOptions
    ) =>
      ApiFetcher.create(request, "/inspections").json(input).post<{
        inspection: Inspection;
        session: InspectionSession | null;
      }>(options),
    getSession: (request: Request, id: string) =>
      ApiFetcher.create(request, "/inspections/sessions/:id", {
        id,
      }).get<InspectionSession>(),
    getActiveOrRecentlyExpiredSessionsForAsset: (request: Request, assetId: string) =>
      ApiFetcher.create(request, "/inspections/active-sessions/asset/:assetId", {
        assetId,
      }).get<InspectionSession[]>(),
    cancelRouteSession: (request: Request, id: string) =>
      ApiFetcher.create(request, "/inspections/sessions/:id/cancel", {
        id,
      }).post(),
  },
  inspectionsPublic: {
    isValidTagUrl: (request: Request, tagUrl: string) =>
      ApiFetcher.create(request, "/inspections-public/is-valid-tag-url", {
        url: tagUrl,
      }).get<{
        isValid: boolean;
        inspectionToken?: string;
      }>({
        bypassAuth: true,
      }),
    isValidTagId: (request: Request, { id, extId }: { id?: string; extId?: string }) =>
      ApiFetcher.create(request, "/inspections-public/is-valid-tag-id", {
        id,
        extId,
      }).get<{
        isValid: boolean;
        tag: { id: string; externalId: string } | null;
        inspectionToken?: string;
      }>({
        bypassAuth: true,
      }),
    validateInspectionToken: (request: Request, token: string) =>
      ApiFetcher.create(request, "/inspections-public/validate-token")
        .setHeader(INSPECTION_TOKEN_HEADER, token)
        .get<{
          isValid: boolean;
          reason: string | null;
          tagExternalId: string;
          serialNumber: string;
          expiresOn: string;
        }>({
          bypassAuth: true,
        }),
  },
  inspectionRoutes: {
    ...CRUD.for<InspectionRoute>("/inspection-routes").all(),

    getForAssetId: (request: Request, assetId: string) =>
      ApiFetcher.create(request, "/inspection-routes/asset/:assetId", {
        assetId,
      }).get<InspectionRoute[]>(),
  },
  productRequests: {
    ...CRUD.for<ProductRequest>("/product-requests").all(),
  },

  // PRODUCTS
  products: CRUD.for<Product>("/products").all(),
  manufacturers: CRUD.for<Manufacturer>("/manufacturers").all(),
  productCategories: CRUD.for<ProductCategory>("/product-categories").all(),
  ansiCategories: CRUD.for<AnsiCategory>("/ansi-categories").all(),
  assetQuestions: {
    ...CRUD.for<AssetQuestion>("/asset-questions").all(),
    findByAsset: (request: Request, assetId: string, type?: "SETUP" | "INSPECTION") =>
      ApiFetcher.create(request, "/asset-questions/by-asset/:assetId", {
        assetId,
        ...(type && { type }),
      }).get<AssetQuestion[]>(),
  },
  // CLIENTS & SITES
  clients: {
    ...CRUD.for<Client>("/clients").all(),
  },
  users: CRUD.for<ClientUser>(`/users`).all(),
  sites: CRUD.for<Site>("/sites").all(),

  // Other ADMIN
  roles: CRUD.for<Role>("/roles").all(),
  settings: {
    getGlobal: (request: Request) =>
      ApiFetcher.create(request, "/settings/global").get<
        SettingsBlock<z.infer<typeof globalSettingsSchema>>
      >(),
  },
  vaultOwnerships: {
    ...CRUD.for<VaultOwnership>("/vault-ownerships").all(),
    create: (request: Request, input: z.infer<typeof createVaultOwnershipSchema>) =>
      ApiFetcher.create(request, "/vault-ownerships").json(input).post<VaultOwnership>(),
    getByKey: (request: Request, key: string) =>
      ApiFetcher.create(request, "/vault-ownerships/key/:key", {
        key,
      }).get<VaultOwnership>(),
  },
  reports: {
    list: (request: Request) => ApiFetcher.create(request, "/reports").get<ListReportsResult[]>(),
    get: (request: Request, id: string, query: QueryParams) =>
      ApiFetcher.create(request, "/reports/:id", {
        id,
        ...query,
      }).get<GetReportResult>(),
  },
};
