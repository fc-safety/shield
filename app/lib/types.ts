import type { SortingState } from "@tanstack/react-table";

import type { QuickRangeId } from "~/components/date-range-select";
import type { QueryParams } from "./urls";

export type BaseUIComponentProps = {
  className?: string;
};

// Use flat structure to ease data access and updates. This should be kept relatively
// small to avoid reaching cookie size limits.
export interface AppState {
  sidebarState?: Record<string, boolean>;

  // Dashboard
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
  products_showAll?: boolean;
  products_grp?: string[];
  categories_showAll?: boolean;
  manufacturers_showAll?: boolean;

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
  permissions: string[];
  notificationGroups: string[];
  createdOn: string;
  updatedOn: string;
  clientAssignable: boolean;
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
  roleName?: string;
  position?: string;
}

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
