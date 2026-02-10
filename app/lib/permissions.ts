export const VISIBILITY = {
  SUPER_ADMIN: "visibility:super-admin",
  GLOBAL: "visibility:global",
  CLIENT_SITES: "visibility:client-sites",
  SITE_GROUP: "visibility:site-group",
  MULTI_SITE: "visibility:multi-site",
  SINGLE_SITE: "visibility:single-site",
  SELF: "visibility:self",
} as const;

export type TVisibilityPermissions = (typeof VISIBILITY)[keyof typeof VISIBILITY];
export type TVisibility = TVisibilityPermissions extends `visibility:${infer R}` ? R : never;

// New types for backend permission model
export type TScope = "SYSTEM" | "GLOBAL" | "CLIENT" | "SITE_GROUP" | "SITE" | "SELF";

// Simplified capabilities that replace fine-grained permissions
export const CAPABILITIES = {
  /** Read tags/assets/questions and create inspection records */
  PERFORM_INSPECTIONS: "perform-inspections",

  /** Create product and supply requests */
  SUBMIT_REQUESTS: "submit-requests",

  /** Create, edit, and delete assets, consumables, and tags */
  MANAGE_ASSETS: "manage-assets",

  /** Create and edit inspection routes and schedules */
  MANAGE_ROUTES: "manage-routes",

  /** Review and resolve alerts from failed inspections */
  RESOLVE_ALERTS: "resolve-alerts",

  /** Access compliance reports and statistics */
  VIEW_REPORTS: "view-reports",

  /** Create users, assign roles, and send invitations */
  MANAGE_USERS: "manage-users",

  /** Manage product catalog, categories, questions, and manufacturers */
  CONFIGURE_PRODUCTS: "configure-products",

  /** Approve or reject product and supply requests */
  APPROVE_REQUESTS: "approve-requests",

  /** Generate tag URLs and program NFC tags (global/paid resource) */
  PROGRAM_TAGS: "program-tags",

  /** Register assets to tags */
  REGISTER_TAGS: "register-tags",
} as const;

export type TCapability = (typeof CAPABILITIES)[keyof typeof CAPABILITIES];
