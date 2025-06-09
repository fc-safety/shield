export enum AlertsStatus {
  CRITICAL,
  URGENT,
  WARNING,
  INFO,
  AUDIT,
  NONE,
}

export const AssetInspectionsStatuses = [
  "COMPLIANT_DUE_LATER",
  "COMPLIANT_DUE_SOON",
  "NON_COMPLIANT_INSPECTED",
  "NON_COMPLIANT_NEVER_INSPECTED",
] as const;
export type AssetInspectionsStatus = (typeof AssetInspectionsStatuses)[number];
