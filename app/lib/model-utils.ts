import { differenceInDays, isAfter } from "date-fns";
import { AlertsStatus, type AssetInspectionsStatus } from "./enums";
import type { Alert, Inspection } from "./models";

export const getAssetInspectionStatus = (
  inspections: Inspection[],
  inspectionCycle: number = 30
): AssetInspectionsStatus => {
  const mostRecentInspection = inspections
    ?.sort((a, b) => (isAfter(a.createdOn, b.createdOn) ? -1 : 1))
    .at(0);
  if (!mostRecentInspection) return "NON_COMPLIANT_NEVER_INSPECTED";
  const daysSinceInspection = differenceInDays(
    Date.now(),
    mostRecentInspection.createdOn
  );
  const dueSoonThreshold = Math.max(
    inspectionCycle - 7,
    Math.floor(inspectionCycle / 2)
  );
  if (daysSinceInspection < dueSoonThreshold) return "COMPLIANT_DUE_LATER";
  if (daysSinceInspection < inspectionCycle) return "COMPLIANT_DUE_SOON";
  return "NON_COMPLIANT_INSPECTED";
};

export const getAssetAlertsStatus = (alerts: Alert[]): AlertsStatus => {
  const unresolvedAlerts = alerts.filter((a) => !a.resolved);
  return unresolvedAlerts.some((a) => a.alertLevel === "URGENT")
    ? AlertsStatus.URGENT
    : unresolvedAlerts.some((a) => a.alertLevel === "INFO")
    ? AlertsStatus.INFO
    : AlertsStatus.NONE;
};
