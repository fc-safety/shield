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
  siteId: string;
  clientId: string;
  inspections?: Inspection[];
  setupQuestionResponses?: AssetQuestionResponse[];
  consumables?: Consumable[];
  alerts?: Alert[];
  productRequests?: ProductRequest[];

  // TODO: remove this
  status: string;
}

export interface Consumable extends BaseModel {
  asset?: Asset;
  assetId: string;
  product: Product;
  productId: string;
  expiresOn: string | null;
  siteId: string;
  clientId: string;
}

export interface AssetQuestionResponse extends BaseModel {
  value: string | number;
  assetQuestion?: AssetQuestion;
  assetQuestionId: string;
}

export interface Tag extends BaseModel {
  serialNumber: string;
  asset?: Asset | null;
  siteId?: string;
  clientId?: string;
  client?: Client | null;
  site?: Site | null;
}

export interface Inspection extends BaseModel {
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
}

export const InspectionStatuses = ["PENDING", "COMPLETE"] as const;
export type InspectionStatus = (typeof InspectionStatuses)[number];

export interface ProductRequest extends BaseModel {
  status: ProductRequestStatus;
  requestor: Person;
  productRequestApprovals: ProductRequestApproval[];
  productRequestItems: ProductRequestItem[];
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
  "FULLFILLED",
  "CANCELLED",
  "COMPLETE",
] as const;
export type ProductRequestStatus = (typeof ProductRequestStatuses)[number];

export interface ProductRequestApproval extends BaseModel {
  approved: boolean;
  approver: Person;
}

export interface ProductRequestItem extends BaseModel {
  product: Product;
  quantity: number;
  addedBy: Person;
}

export interface Address {
  id: string;
  street1: string;
  street2: string | null;
  city: string;
  state: string;
  zip: string;
}

export const ClientStatuses = ["PENDING", "ACTIVE", "INACTIVE"] as const;

export interface Client extends BaseModel {
  externalId: string;
  status: (typeof ClientStatuses)[number];
  startedOn: string;
  name: string;
  address: Address;
  addressId: string;
  phoneNumber: string;
  homeUrl?: string;
  sites?: Site[];
  _count?: { sites: number };
}

export interface Site extends BaseModel {
  externalId: string;
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

export const AssetQuestionTypes = ["SETUP", "INSPECTION"] as const;
export type AssetQuestionType = (typeof AssetQuestionTypes)[number];

export const AssetQuestionResponseTypes = [
  "BINARY",
  "INDETERMINATE_BINARY",
  "TEXT",
  "TEXTAREA",
  "DATE",
  "NUMBER",
  "IMAGE",
] as const;
export type AssetQuestionResponseType =
  (typeof AssetQuestionResponseTypes)[number];

export interface AssetQuestion extends BaseModel {
  active: boolean;
  type: AssetQuestionType;
  required: boolean;
  order?: number | null;
  prompt: string;
  valueType: AssetQuestionResponseType;
  assetAlertCriteria?: AssetAlertCriterion[];
  productCategory?: ProductCategory | null;
  productCategoryId: string | null;
  product?: Product | null;
  productId: string | null;
  consumableConfig?: ConsumableQuestionConfig | null;
  consumableConfigId: string | null;
}

export interface Alert extends BaseModel {
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
  resolutionNote: string | null;
  site?: Site;
  siteId: string;
  client?: Client;
  clientId: string;
}

export const AlertLevels = ["URGENT", "INFO"] as const;
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
}

export interface ProductCategory extends BaseModel {
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
}

export interface Manufacturer extends BaseModel {
  active: boolean;
  name: string;
  homeUrl?: string | null;
  products?: Omit<Product, "manufacturer">[];
  _count?: { products: number };
  client?: Client;
}

export const ProductTypes = ["CONSUMABLE", "PRIMARY"] as const;

export interface Product extends BaseModel {
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
  parentProduct?: Product | null;
  assetQuestions?: AssetQuestion[];
  client?: Client | null;

  // TODO: Add consumable support
  consumableProducts?: Product[];
}

export interface ConsumableQuestionConfig extends BaseModel {
  consumableProduct?: Product;
  consumableProductId: string;
  mappingType: ConsumableMappingType;
}

export const ConsumableMappingTypes = ["EXPIRATION_DATE"] as const;
export type ConsumableMappingType = (typeof ConsumableMappingTypes)[number];
