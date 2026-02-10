import type { SortingState } from "@tanstack/react-table";

import type { QuickRangeId } from "~/components/date-range-select";
import type { AssetQuestion } from "./models";
import type { QueryParams } from "./urls";
import type { TCapability, TScope } from "./permissions";

export interface ActiveAccessGrant {
  clientId: string;
  siteId: string;
  roleId: string;
}

export type BaseUIComponentProps = {
  className?: string;
};

// Use flat structure to ease data access and updates. This should be kept relatively
// small to avoid reaching cookie size limits.
export interface AppState {
  // Multi-Client Access
  activeAccessGrant?: ActiveAccessGrant;

  timeZone?: string;
  locale?: string;

  // Multi-Client Access
  activeClientId?: string;

  sidebarState?: Record<string, boolean>;

  // Dashboard
  // Overall Compliance Summary
  dash_sum_site_id?: string;

  // -> Supply Requests
  dash_pr_query?: QueryParams & {
    createdOn: {
      gte: string;
      lte?: string;
    };
  };
  dash_pr_sort?: SortingState;
  dash_pr_quickRangeId?: QuickRangeId<"past">;
  dash_pr_view?: "summary" | "details";

  // -> Inspections
  dash_insp_query?: QueryParams & {
    createdOn: {
      gte: string;
      lte?: string;
    };
  };
  dash_insp_sort?: SortingState;
  dash_insp_quickRangeId?: QuickRangeId<"past">;

  // -> Inspection Alerts
  dash_alert_query?: QueryParams & {
    createdOn: {
      gte: string;
      lte?: string;
    };
  };
  dash_alert_sort?: SortingState;
  dash_alert_quickRangeId?: QuickRangeId<"past">;
  dash_alert_view?: "summary" | "details";

  // -> Compliance History
  dash_comp_hist_months?: number;

  // Products
  products_grp?: string[];

  // Legacy Redirect
  show_legacy_redirect?: boolean;

  // Reports
  reports_dateRanges?: Record<
    string,
    {
      from: string;
      to: string;
      quickRangeId?: QuickRangeId<"both">;
    }
  >;
}

export interface Role {
  id: string;
  groupId: string;
  name: string;
  description?: string;
  scope: "SYSTEM" | "GLOBAL" | "CLIENT" | "SITE_GROUP" | "SITE" | "SELF";
  capabilities: string[];
  notificationGroups: string[];
  createdOn: string;
  updatedOn: string;
  clientAssignable: boolean;
}

export interface UserRole {
  id: string;
  name: string;
  permissions: string[];
}

export interface Permission {
  id: string;
  name: string;
  friendlyName: string;
  description: string;
  type: "visibility" | "action";
  clientId: string;
}

export interface PermissionsGroup {
  title: string;
  many?: boolean;
  permissions?: Permission[];
  children?: PermissionsGroup[];
  defaultName?: string;
}

export interface GetPermissionsResponse {
  permissionsFlat: Permission[];
  permissions: {
    visibility: PermissionsGroup;
    resources: PermissionsGroup;
  };
}

export interface NotificationGroup {
  id: string;
  name: string;
  description: string;
}

export interface Capability {
  name: string;
  label: string;
  description: string;
}

export interface ClientUser {
  id: string;
  createdOn: string;
  modifiedOn: string;
  idpId: string;
  active: boolean;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phoneNumber?: string;
  username?: string;
  siteExternalId: string;
  clientExternalId: string;
  roleName?: string; // Deprecated: Use roles array instead. Kept for backward compatibility.
  roles: UserRole[]; // Array of roles assigned to the user
  position?: string;
  clientAccess: Array<{
    id: string;
    isPrimary: boolean;
    client: { id: string; externalId: string; name: string };
    site: { id: string; externalId: string; name: string };
    role: { id: string; name: string; scope: TScope };
  }>;
}

export type UserResponse = ClientUser;

export interface ResponseValueImage {
  urls: string[];
}

export interface Job<TData> {
  name: string;
  data: TData;
  opts: {
    attempts: number;
    backoff: {
      delay: number;
      type: "exponential";
    };
  };
  id: string;
  progress: number;
  returnvalue: unknown;
  stacktrace: string[];
  delay: number;
  priority: number;
  attemptsStarted: number;
  attemptsMade: number;
  timestamp: number;
  queueQualifiedName: string;
  finishedOn: number;
  processedOn: number;
  failedReason: string;
}

export interface JobQueue {
  queueName: string;
  failedJobs: Job<unknown>[];
  waitingJobs: Job<unknown>[];
  activeJobs: Job<unknown>[];
}

export const ReportTypes = ["CANNED"] as const;
export type ReportType = (typeof ReportTypes)[number];

export type DateRangeSupport = "NONE" | "PAST" | "FUTURE" | "BOTH";

export interface ListReportsResult {
  id: string;
  name: string;
  description: string;
  type: ReportType;
  dateRangeSupport: DateRangeSupport;
}

export interface GetReportResult extends ListReportsResult {
  columns: string[];
  data: unknown[];
}

export interface AssetQuestionCheckResult {
  key: string;
  staticValue?: string;
  assetValue: string | null;
  isMet: boolean;
  assetQuestion: AssetQuestion;
}

export interface CheckConfigurationByAssetResult {
  checkResults: AssetQuestionCheckResult[];
  isConfigurationMet: boolean;
}

// Multi-Client Access Types

export interface ClientAccessClient {
  id: string;
  externalId: string;
  name: string;
}

export interface ClientAccessSite {
  id: string;
  externalId: string;
  name: string;
}

export interface ClientAccessRole {
  id: string;
  name: string;
  description?: string;
}

export interface ClientAccess {
  id: string;
  personId: string;
  clientId: string;
  siteId: string;
  roleId: string;
  isPrimary: boolean;
  createdOn: string;
  client: ClientAccessClient;
  site: ClientAccessSite;
  role: ClientAccessRole;
}

export const InvitationStatuses = ["PENDING", "ACCEPTED", "EXPIRED", "REVOKED"] as const;
export type InvitationStatus = (typeof InvitationStatuses)[number];

export interface Invitation {
  id: string;
  code: string;
  clientId: string;
  createdById: string;
  email?: string;
  roleId?: string;
  siteId?: string;
  status: InvitationStatus;
  expiresOn: string;
  acceptedById?: string;
  acceptedOn?: string;
  createdOn: string;
  modifiedOn: string;
  inviteUrl?: string;
  client?: ClientAccessClient;
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  role?: ClientAccessRole;
  site?: ClientAccessSite;
}

export interface InvitationValidation {
  valid: boolean;
  client: { name: string };
  expiresOn: string;
  restrictedToEmail: boolean;
  hasPreassignedRole: boolean;
}

export interface MyClientAccess {
  clientId: string;
  clientName: string;
  siteId: string;
  siteName: string;
  roleId: string;
  roleName: string;
  scope: TScope;
  capabilities: TCapability[];
}

// Member Types (new /members API)

export interface MemberClientAccess {
  id: string;
  isPrimary: boolean;
  role: { id: string; name: string };
  site: { id: string; name: string };
}

export interface Member {
  id: string;
  createdOn: string;
  modifiedOn: string;
  idpId?: string;
  active: boolean;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  position?: string;
  clientAccess: MemberClientAccess[];
}

export interface AcceptInvitationResult {
  success: boolean;
  clientAccess: ClientAccess;
}
