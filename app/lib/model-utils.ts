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
  if (!mostRecentInspection) return "NEVER";
  const daysSinceInspection = differenceInDays(
    Date.now(),
    mostRecentInspection.createdOn
  );
  const dueSoonThreshold = Math.max(
    inspectionCycle - 7,
    Math.floor(inspectionCycle / 2)
  );
  if (daysSinceInspection < dueSoonThreshold) return "COMPLIANT";
  if (daysSinceInspection < inspectionCycle) return "DUE_SOON";
  return "NON_COMPLIANT";
};

export const getAssetAlertsStatus = (alerts: Alert[]): AlertsStatus => {
  const unresolvedAlerts = alerts.filter((a) => !a.resolved);
  return unresolvedAlerts.some((a) => a.alertLevel === "URGENT")
    ? AlertsStatus.URGENT
    : unresolvedAlerts.some((a) => a.alertLevel === "INFO")
    ? AlertsStatus.INFO
    : AlertsStatus.NONE;
};
