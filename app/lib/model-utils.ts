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

  let hasCritical = false;
  let hasUrgent = false;
  let hasWarning = false;
  let hasInfo = false;
  let hasAudit = false;

  for (const unresolvedAlert of unresolvedAlerts) {
    if (unresolvedAlert.alertLevel === "CRITICAL") {
      hasCritical = true;
    } else if (unresolvedAlert.alertLevel === "URGENT") {
      hasUrgent = true;
    } else if (unresolvedAlert.alertLevel === "WARNING") {
      hasWarning = true;
    } else if (unresolvedAlert.alertLevel === "INFO") {
      hasInfo = true;
    } else if (unresolvedAlert.alertLevel === "AUDIT") {
      hasAudit = true;
    }
  }

  if (hasCritical) return AlertsStatus.CRITICAL;
  if (hasUrgent) return AlertsStatus.URGENT;
  if (hasWarning) return AlertsStatus.WARNING;
  if (hasInfo) return AlertsStatus.INFO;
  if (hasAudit) return AlertsStatus.AUDIT;
  return AlertsStatus.NONE;
};
