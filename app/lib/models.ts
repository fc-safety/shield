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
  product: Product;
  expiresOn?: Date;
  siteId: string;
  clientId: string;
}

export interface Tag extends BaseModel {
  setupOn: Date;
  serialNumber: string;
  asset: Asset;
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
  street_1: string;
  street_2: string;
  city: string;
  state: string;
  zip: string;
}

export interface Client {
  id: string;
  name: string;
  address: Address;
}

export interface Site {
  id: string;
  name: string;
  client: Client;
  parent_site: Site | null;
  address: Address;
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

export interface ProductCategory {
  id: string;
  name: string;
  shortName: string;
  description: string;
  icon: string;
  color: string;
}

export interface Manufacturer {
  id: string;
  active: boolean;
  name: string;
  home_url: string;
}

export interface Product {
  id: string;
  active: boolean;
  productCategory: ProductCategory;
  manufacturer: Manufacturer;
  name: string;
  description: string;
  sku: string;
  productUrl: string;
  imageUrl: string;
}
