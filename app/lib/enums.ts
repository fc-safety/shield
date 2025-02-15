export enum AlertsStatus {
  URGENT,
  INFO,
  NONE,
}

export const AssetInspectionsStatuses = [
  "EXPIRED",
  "OVERDUE",
  "OK",
  "NEVER",
] as const;
export type AssetInspectionsStatus = (typeof AssetInspectionsStatuses)[number];
