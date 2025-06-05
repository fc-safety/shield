import type { AssetInspectionsStatus } from "./enums";

export const STATUS_LABELS: Record<AssetInspectionsStatus, string> = {
  COMPLIANT_DUE_LATER: "Compliant",
  COMPLIANT_DUE_SOON: "Due Soon",
  NON_COMPLIANT_INSPECTED: "Non-Compliant",
  NON_COMPLIANT_NEVER_INSPECTED: "Never Inspected",
};

export const STATUS_SORT_VALUES: Record<AssetInspectionsStatus, number> = {
  COMPLIANT_DUE_LATER: 0,
  COMPLIANT_DUE_SOON: 1,
  NON_COMPLIANT_INSPECTED: 2,
  NON_COMPLIANT_NEVER_INSPECTED: 3,
};

type StatusInput =
  | AssetInspectionsStatus
  | { status: AssetInspectionsStatus }
  | [AssetInspectionsStatus];

export function getStatusLabel(status: StatusInput): string {
  if (typeof status === "string") {
    return STATUS_LABELS[status];
  }
  if (Array.isArray(status)) {
    return STATUS_LABELS[status[0]];
  }
  return STATUS_LABELS[status.status];
}

export function getStatusSortValue(status: StatusInput): number {
  if (typeof status === "string") {
    return STATUS_SORT_VALUES[status];
  }
  if (Array.isArray(status)) {
    return STATUS_SORT_VALUES[status[0]];
  }
  return STATUS_SORT_VALUES[status.status];
}

export const sortByStatus =
  (asc = true) =>
  (a: StatusInput, b: StatusInput): number => {
    const sortValueA = getStatusSortValue(a);
    const sortValueB = getStatusSortValue(b);
    return asc ? sortValueA - sortValueB : sortValueB - sortValueA;
  };
