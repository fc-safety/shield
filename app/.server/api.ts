import { z } from "zod";
import {
  type Alert,
  type AnsiCategory,
  type Asset,
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
import type {
  ClientUser,
  GetReportResult,
  ListReportsResult,
  Role,
} from "~/lib/types";
import type { QueryParams } from "~/lib/urls";
import { INSPECTION_TOKEN_HEADER } from "~/routes/inspect/constants/headers";
import {
  CRUD,
  defaultDataGetter,
  FetchOptions,
  getAuthenticatedData,
  type FetchBuildOptions,
} from "./api-utils";

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
    setup: (request: Request, input: z.infer<typeof setupAssetSchema>) => {
      return getAuthenticatedData<Asset>(request, [
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
      return getAuthenticatedData<Asset>(request, [
        FetchOptions.url("/assets/:id/setup", { id: input.id })
          .patch()
          .json(input)
          .build(),
      ]);
    },
  },
  alerts: {
    ...CRUD.for<Alert>("/alerts"),
    resolve: (
      request: Request,
      id: string,
      input: z.infer<typeof resolveAlertSchema>
    ) => {
      return getAuthenticatedData<Alert>(request, [
        FetchOptions.url(`/alerts/${id}/resolve`).post().json(input).build(),
      ]);
    },
  },
  tags: {
    ...CRUD.for<Tag>("/tags").all(),
    create: (request: Request, input: z.infer<typeof createTagSchema>) =>
      getAuthenticatedData<Tag>(request, [
        FetchOptions.url("/tags").post().json(input).build(),
      ]),
    getForInspection: (request: Request, externalId: string) =>
      getAuthenticatedData<Tag>(request, [
        FetchOptions.url("/tags/for-inspection/:externalId", { externalId })
          .get()
          .build(),
      ]),
    checkRegistration: (request: Request, inspectionToken: string) =>
      getAuthenticatedData<Tag>(request, [
        FetchOptions.url("/tags/check-registration")
          .get()
          .setHeader(INSPECTION_TOKEN_HEADER, inspectionToken)
          .build(),
      ]),
    getForAssetSetup: (request: Request, externalId: string) =>
      getAuthenticatedData<Tag>(request, [
        FetchOptions.url("/tags/for-asset-setup/:externalId", { externalId })
          .get()
          .build(),
      ]),
  },
  inspections: {
    ...CRUD.for<Inspection>("/inspections").all(),
    create: (
      request: Request,
      input: z.infer<typeof backendCreateInspectionSchema>,
      options: FetchBuildOptions
    ) =>
      getAuthenticatedData<{
        inspection: Inspection;
        session: InspectionSession | null;
      }>(request, [
        FetchOptions.url("/inspections").post().json(input).build(options),
      ]),
    getSession: (request: Request, id: string) =>
      getAuthenticatedData<InspectionSession>(request, [
        FetchOptions.url("/inspections/sessions/:id", { id }).get().build(),
      ]),
    getActiveSessionsForAsset: (request: Request, assetId: string) =>
      getAuthenticatedData<InspectionSession[]>(request, [
        FetchOptions.url("/inspections/active-sessions/asset/:assetId", {
          assetId,
        })
          .get()
          .build(),
      ]),
    completeSession: (request: Request, id: string) =>
      getAuthenticatedData<InspectionSession>(request, [
        FetchOptions.url("/inspections/sessions/:id/complete", { id })
          .post()
          .build(),
      ]),
  },
  inspectionsPublic: {
    isValidTagUrl: (request: Request, tagUrl: string) => {
      const { url, options } = FetchOptions.url(
        "/inspections-public/is-valid-tag-url",
        { url: tagUrl }
      )
        .get()
        .build();

      return defaultDataGetter<{
        isValid: boolean;
        inspectionToken?: string;
      }>(fetch(url, options));
    },
    isValidTagId: (
      request: Request,
      { id, extId }: { id?: string; extId?: string }
    ) => {
      const { url, options } = FetchOptions.url(
        "/inspections-public/is-valid-tag-id",
        { id, extId }
      )
        .get()
        .build();

      return defaultDataGetter<{
        isValid: boolean;
        tag: { id: string; externalId: string } | null;
        inspectionToken?: string;
      }>(fetch(url, options));
    },
    validateInspectionToken: (request: Request, token: string) => {
      const { url, options } = FetchOptions.url(
        "/inspections-public/validate-token"
      )
        .get()
        .setHeader(INSPECTION_TOKEN_HEADER, token)
        .build();

      return defaultDataGetter<{
        isValid: boolean;
        reason: string | null;
        tagExternalId: string;
        serialNumber: string;
        expiresOn: string;
      }>(fetch(url, options));
    },
  },
  inspectionRoutes: {
    ...CRUD.for<InspectionRoute>("/inspection-routes").all(),

    getForAssetId: (request: Request, assetId: string) =>
      getAuthenticatedData<InspectionRoute[]>(request, [
        FetchOptions.url("/inspection-routes/asset/:assetId", { assetId })
          .get()
          .build(),
      ]),
  },
  productRequests: {
    ...CRUD.for<ProductRequest>("/product-requests").all(),
  },

  // PRODUCTS
  products: CRUD.for<Product>("/products").all(),
  manufacturers: CRUD.for<Manufacturer>("/manufacturers").all(),
  productCategories: CRUD.for<ProductCategory>("/product-categories").all(),
  ansiCategories: CRUD.for<AnsiCategory>("/ansi-categories").all(),
  // CLIENTS & SITES
  clients: {
    ...CRUD.for<Client>("/clients").all(),
  },
  users: CRUD.for<ClientUser>(`/users`).all(),
  sites: CRUD.for<Site>("/sites").except(["list"]),

  // Other ADMIN
  roles: CRUD.for<Role>("/roles").all(),
  settings: {
    getGlobal: (request: Request) =>
      getAuthenticatedData<SettingsBlock<z.infer<typeof globalSettingsSchema>>>(
        request,
        [FetchOptions.url("/settings/global").get().build()]
      ),
  },
  vaultOwnerships: {
    ...CRUD.for<VaultOwnership>("/vault-ownerships").all(),
    create: (
      request: Request,
      input: z.infer<typeof createVaultOwnershipSchema>
    ) =>
      getAuthenticatedData<VaultOwnership>(request, [
        FetchOptions.url("/vault-ownerships").post().json(input).build(),
      ]),
    getByKey: (request: Request, key: string) =>
      getAuthenticatedData<VaultOwnership>(request, [
        FetchOptions.url("/vault-ownerships/key/:key", { key }).get().build(),
      ]),
  },
  reports: {
    list: (request: Request) =>
      getAuthenticatedData<ListReportsResult[]>(request, [
        FetchOptions.url("/reports").get().build(),
      ]),
    get: (request: Request, id: string, query: QueryParams) =>
      getAuthenticatedData<GetReportResult>(request, [
        FetchOptions.url("/reports/:id", { id, ...query })
          .get()
          .build(),
      ]),
  },
};
