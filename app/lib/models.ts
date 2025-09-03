import type { ResponseValueImage } from "./types";

export interface ResultsPage<T> {
  results: T[];
  count: number;
  limit?: number;
  offset?: number;
}

export interface BaseModel {
  id: string;
  createdOn: string;
  modifiedOn: string;
}

export interface Asset extends BaseModel {
  legacyAssetId?: string | null;
  setupOn: string | null;
  active: boolean;
  name: string;
  product: Product;
  productId: string;
  tagId?: string;
  tag?: Tag;
  location: string;
  placement: string;
  serialNumber: string;
  inspectionCycle: number | null;
  inspections?: Inspection[];
  setupQuestionResponses?: AssetQuestionResponse[];
  consumables?: Consumable[];
  alerts?: Alert[];
  productRequests?: ProductRequest[];
  inspectionRoutePoints?: InspectionRoutePoint[];
  metadata?: Record<string, string>;

  siteId: string;
  site?: Site;
  clientId: string;
  client?: Client;
}

export interface Consumable extends BaseModel {
  legacyInventoryId?: string | null;
  asset?: Asset;
  assetId: string;
  product: Product;
  productId: string;
  expiresOn: string | null;
  quantity: number;
  siteId: string;
  site?: Site;
  clientId: string;
  client?: Client;
}

export interface AssetQuestionResponse extends BaseModel {
  value: string | number | ResponseValueImage;
  assetQuestion?: AssetQuestion;
  assetQuestionId: string;
}

export interface Tag extends BaseModel {
  externalId: string;
  serialNumber: string;
  legacyTagId?: string | null;
  asset?: Asset | null;
  siteId?: string;
  clientId?: string;
  client?: Client | null;
  site?: Site | null;
}

export interface Inspection extends BaseModel {
  legacyLogId?: string | null;
  asset: Asset;
  inspector?: Person;
  status: InspectionStatus;
  useragent?: string;
  ipv4?: string;
  ipv6?: string;
  latitude?: number;
  longitude?: number;
  locationAccuracy?: number;
  comments?: string;
  responses?: AssetQuestionResponse[];
  alerts?: Alert[];
  siteId: string;
  site?: Site;
  clientId: string;
  client?: Client;
}

export const InspectionStatuses = ["PENDING", "COMPLETE"] as const;
export type InspectionStatus = (typeof InspectionStatuses)[number];

export interface InspectionRoute extends BaseModel {
  name: string;
  description?: string | null;
  inspectionRoutePoints?: InspectionRoutePoint[];
  site?: Site;
  siteId: string;
  client?: Client;
  clientId: string;
}

export interface InspectionRoutePoint extends BaseModel {
  order: number;
  asset?: Asset;
  assetId: string;
  site?: Site;
  siteId: string;
  client?: Client;
  clientId: string;
  inspectionRoute?: InspectionRoute;
  inspectionRouteId: string;
}

export interface InspectionSession extends BaseModel {
  status: InspectionSessionStatus;
  inspectionRoute?: InspectionRoute;
  inspectionRouteId: string;
  completedInspectionRoutePoints?: CompletedInspectionRoutePoint[];
  lastInspector?: Person;
  lastInspectorId: string;
  site?: Site;
  siteId: string;
  client?: Client;
  clientId: string;
}

export const InspectionSessionStatuses = ["PENDING", "COMPLETE", "EXPIRED", "CANCELLED"] as const;
export type InspectionSessionStatus = (typeof InspectionSessionStatuses)[number];

export interface CompletedInspectionRoutePoint extends BaseModel {
  inspectionSession?: InspectionSession;
  inspectionSessionId: string;
  inspectionRoutePoint?: InspectionRoutePoint;
  inspectionRoutePointId: string;
  inspection?: Inspection;
  inspectionId: string;
}

export interface ProductRequest extends BaseModel {
  legacyRequestId?: string | null;
  status: ProductRequestStatus;
  requestor: Person;
  productRequestApprovals?: ProductRequestApproval[];
  productRequestItems: ProductRequestItem[];
  asset?: Asset;
  assetId: string;
  site?: Site;
  siteId: string;
  client?: Client;
  clientId: string;
}

export const ProductRequestStatuses = [
  "NEW",
  "APPROVED",
  "RECEIVED",
  "PROCESSING",
  "FULFILLED",
  "CANCELLED",
  "COMPLETE",
] as const;
export type ProductRequestStatus = (typeof ProductRequestStatuses)[number];

export interface ProductRequestApproval extends BaseModel {
  approved: boolean;
  approver?: Person;
}

export interface ProductRequestItem extends BaseModel {
  legacyRequestItemId?: string | null;
  product: Product;
  quantity: number;
  addedBy: Person;
}

export interface Address {
  id: string;
  street1: string;
  street2: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  county: string | null;
  country: string | null;
}

export const ClientStatuses = ["PENDING", "ACTIVE", "INACTIVE", "LEGACY"] as const;

export interface Client extends BaseModel {
  externalId: string;
  legacyClientId?: string | null;
  status: (typeof ClientStatuses)[number];
  startedOn: string;
  name: string;
  address: Address;
  addressId: string;
  phoneNumber: string;
  homeUrl?: string;
  defaultInspectionCycle: number;
  demoMode: boolean;
  sites?: Site[];
  _count?: { sites: number };
}

export interface Site extends BaseModel {
  externalId: string;
  legacySiteId?: string | null;
  legacyGroupId?: string | null;
  name: string;
  address: Address;
  addressId: string;
  phoneNumber: string;
  primary: boolean;
  parentSite?: Site | null;
  parentSiteId?: string | null;
  client?: Client;
  clientId: string;
  subsites?: Site[];
  _count?: {
    subsites: number;
  };
}

export interface Person extends BaseModel {
  firstName: string;
  lastName: string;
  email: string;
  username?: string;
  idpId?: string;
  siteId: string;
  clientId: string;
}

export const AssetQuestionTypes = ["SETUP", "INSPECTION", "SETUP_AND_INSPECTION"] as const;
export type AssetQuestionType = (typeof AssetQuestionTypes)[number];

export const AssetQuestionResponseTypes = [
  "BINARY",
  "INDETERMINATE_BINARY",
  "TEXT",
  "TEXTAREA",
  "SELECT",
  "DATE",
  "NUMBER",
  "IMAGE",
] as const;
export type AssetQuestionResponseType = (typeof AssetQuestionResponseTypes)[number];

export const AssetQuestionConditionTypes = [
  "REGION",
  "MANUFACTURER",
  "PRODUCT_CATEGORY",
  "PRODUCT",
  "METADATA",
] as const;
export type AssetQuestionConditionType = (typeof AssetQuestionConditionTypes)[number];

export interface AssetQuestionCondition extends BaseModel {
  assetQuestion?: AssetQuestion;
  assetQuestionId: string;
  conditionType: AssetQuestionConditionType;
  value: string[];
  description: string | null;
}

export interface File extends BaseModel {
  name: string;
  url: string;
  assetQuestion?: AssetQuestion;
  assetQuestionId: string;
}

export interface RegulatoryCode extends BaseModel {
  active: boolean;
  codeIdentifier: string;
  title: string;
  section?: string | null;
  governingBody: string;
  sourceUrl?: string | null;
  documentVersion?: string | null;
  assetQuestion?: AssetQuestion;
  assetQuestionId: string;
}

export interface AssetQuestion extends BaseModel {
  legacyQuestionId?: string | null;
  active: boolean;
  type: AssetQuestionType;
  required: boolean;
  order?: number | null;
  prompt: string;
  valueType: AssetQuestionResponseType;
  selectOptions?:
    | {
        value: string;
        order?: number;
        label?: string;
      }[]
    | null;
  tone: string | null;
  assetAlertCriteria?: AssetAlertCriterion[];
  /** @deprecated */
  productCategory?: ProductCategory | null;
  /** @deprecated */
  productCategoryId: string | null;
  /** @deprecated */
  product?: Product | null;
  /** @deprecated */
  productId: string | null;
  consumableConfig?: ConsumableQuestionConfig | null;
  consumableConfigId: string | null;
  parentQuestion?: AssetQuestion | null;
  parentQuestionId: string | null;
  variants?: AssetQuestion[];
  conditions?: AssetQuestionCondition[];
  files?: File[];
  regulatoryCodes?: RegulatoryCode[];
  setAssetMetadataConfig?: SetAssetMetadataConfig | null;
  _count?: {
    assetAlertCriteria: number;
    conditions: number;
    variants: number;
  };
}

export interface SetAssetMetadataConfig extends BaseModel {
  assetQuestion?: AssetQuestion;
  assetQuestionId: string;
  metadata: {
    key: string;
    type: "DYNAMIC" | "STATIC";
    value: string | null;
  }[];
}

export interface Alert extends BaseModel {
  legacyAlertId?: string | null;
  alertLevel: AlertLevel;
  message: string;
  asset?: Asset;
  assetId: string;
  inspection?: Inspection;
  inspectionId: string;
  assetQuestionResponse?: AssetQuestionResponse;
  assetQuestionResponseId: string;
  assetAlertCriterion?: AssetAlertCriterion;
  assetAlertCriterionId: string;
  resolved: boolean;
  resolvedOn: string | null;
  resolutionNote: string | null;
  inspectionImageUrl: string | null;
  site?: Site;
  siteId: string;
  client?: Client;
  clientId: string;
}

export const AlertLevels = ["CRITICAL", "URGENT", "WARNING", "INFO", "AUDIT"] as const;
export type AlertLevel = (typeof AlertLevels)[number];

interface RuleMatch {
  isEmpty?: boolean;
  equals?: string;
  not?: string;
  contains?: string;
  notContains?: string;
  startsWith?: string;
  endsWith?: string;
  gt?: string | number;
  gte?: string | number;
  lt?: string | number;
  lte?: string | number;
  beforeDaysPast?: number;
  afterDaysPast?: number;
  beforeDaysFuture?: number;
  afterDaysFuture?: number;
}

interface BaseAssetAlertCriterionRule {
  value: string | RuleMatch;
}

type AssetAlertCriterionRule = BaseAssetAlertCriterionRule & {
  AND?: AssetAlertCriterionRule[];
  OR?: AssetAlertCriterionRule[];
};

export interface AssetAlertCriterion extends BaseModel {
  alertLevel: AlertLevel;
  rule: AssetAlertCriterionRule;
  autoResolve: boolean;
}

export interface ProductCategory extends BaseModel {
  legacyCategoryId?: string | null;
  active: boolean;
  name: string;
  shortName?: string | null;
  description?: string | null;
  icon?: string | null;
  color?: string | null;
  assetQuestions?: AssetQuestion[];
  _count?: { products: number };
  products?: Omit<Product, "productCategory">[];
  client?: Client;
  clientId: string | null;
}

export interface Manufacturer extends BaseModel {
  legacyManufacturerId?: string | null;
  active: boolean;
  name: string;
  homeUrl?: string | null;
  products?: Omit<Product, "manufacturer">[];
  _count?: { products: number };
  client?: Client;
  clientId: string | null;
}

export interface AnsiCategory extends BaseModel {
  name: string;
  description: string | null;
  color: string | null;
  icon: string | null;
}

export const ProductTypes = ["CONSUMABLE", "PRIMARY"] as const;

export interface Product extends BaseModel {
  legacyProductId?: string | null;
  legacyConsumableId?: string | null;
  active: boolean;
  manufacturer: Manufacturer;
  manufacturerId: string;
  type: (typeof ProductTypes)[number];
  name: string;
  description?: string | null;
  sku?: string | null;
  productUrl?: string | null;
  imageUrl?: string | null;
  productCategory: ProductCategory;
  productCategoryId: string;
  parentProductId: string | null;
  parentProduct?: Product | null;
  assetQuestions?: AssetQuestion[];
  client?: Client | null;

  consumableProducts?: Product[];
  ansiCategory?: AnsiCategory | null;
  ansiCategoryId: string | null;
}

export interface ConsumableQuestionConfig extends BaseModel {
  consumableProduct?: Product;
  consumableProductId: string;
  mappingType: ConsumableMappingType;
}

export const ConsumableMappingTypes = ["EXPIRATION_DATE"] as const;
export type ConsumableMappingType = (typeof ConsumableMappingTypes)[number];

export interface SettingsBlock<T = Record<string, unknown>> extends BaseModel {
  friendlyId: string;
  data: T;
}

export interface VaultOwnership extends BaseModel {
  key: string;
  buckektName: string | null;
  accessType: VaultAccessType;
  ownerId: string;
  siteId: string;
  clientId: string;
}

export const VaultAccessTypes = [
  "PUBLIC",
  "CLIENT",
  "CLIENT_SITE",
  "CLIENT_OWNER",
  "STRICT_OWNER",
] as const;
export type VaultAccessType = (typeof VaultAccessTypes)[number];
