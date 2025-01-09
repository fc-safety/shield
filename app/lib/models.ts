export interface ResultsPage<T> {
  results: T[];
  count: number;
  limit?: number;
  offset?: number;
}

export interface BaseModel {
  id: string;
  createdOn: Date;
  modifiedOn: Date;
}

export interface Asset extends BaseModel {
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

  // TODO: remove this
  status: string;
}

export interface Consumable extends BaseModel {
  asset?: Asset;
  assetId?: string;
  product: Product;
  productId: string;
  expiresOn?: Date;
  siteId: string;
  clientId: string;
}

export interface Tag extends BaseModel {
  setupOn: Date;
  serialNumber: string;
  asset?: Asset | null;
  assetId?: string | null;
  siteId?: string;
  clientId?: string;
}

export interface Inspection extends BaseModel {
  asset: Asset;
  inspector?: Person;
  status: InspectionStatus;
  userAgent?: string;
  ipv4?: string;
  ipv6?: string;
  latitude?: number;
  longitude?: number;
  comments?: string;
}

enum InspectionStatus {
  PENDING,
  COMPLETE,
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
  startedOn: Date;
  name: string;
  address: Address;
  addressId: string;
  phoneNumber: string;
  homeUrl?: string;
  sites?: Site[];
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

export interface ProductCategory extends BaseModel {
  active: boolean;
  name: string;
  shortName?: string | null;
  description?: string | null;
  icon?: string | null;
  color?: string | null;
}

export interface Manufacturer extends BaseModel {
  active: boolean;
  name: string;
  homeUrl?: string | null;
  products?: Omit<Product, "manufacturer">[];
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

  // TODO: Add consumable support
}
