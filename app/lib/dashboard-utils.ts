import type { AssetInspectionsStatus } from "./enums";

export const STATUS_LABELS: Record<AssetInspectionsStatus, string> = {
  COMPLIANT: "Compliant",
  DUE_SOON: "Due Soon",
  NON_COMPLIANT: "Non-Compliant",
  NEVER: "Never",
};

export const STATUS_SORT_VALUES: Record<AssetInspectionsStatus, number> = {
  COMPLIANT: 0,
  DUE_SOON: 1,
  NON_COMPLIANT: 2,
  NEVER: 3,
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
