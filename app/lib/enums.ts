export enum AlertsStatus {
  URGENT,
  INFO,
  NONE,
}

export const AssetInspectionsStatuses = [
  "COMPLIANT",
  "DUE_SOON",
  "NON_COMPLIANT",
  "NEVER",
] as const;
export type AssetInspectionsStatus = (typeof AssetInspectionsStatuses)[number];
