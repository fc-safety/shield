export const VISIBILITY = {
  GLOBAL: "visibility:global",
  CLIENT_SITES: "visibility:client-sites",
  SITE_GROUP: "visibility:site-group",
  MULTI_SITE: "visibility:multi-site",
  SINGLE_SITE: "visibility:single-site",
  SELF: "visibility:self",
} as const;

export type TVisibilityPermissions =
  (typeof VISIBILITY)[keyof typeof VISIBILITY];
export type TVisibility = TVisibilityPermissions extends `visibility:${infer R}`
  ? R
  : never;

export const PERMISSION_ACTIONS = [
  "create",
  "read",
  "update",
  "delete",
  "manage",
  "setup",
  "update-status",
  "cancel",
  "resolve",
  "review",
] as const;

export type TAction = (typeof PERMISSION_ACTIONS)[number];

export const RESOURCES = [
  "assets",
  "consumables",
  "tags",
  "inspections",
  "asset-questions",
  "alerts",
  "product-requests",
  "clients",
  "sites",
  "people",
  "product-categories",
  "manufacturers",
  "products",
  "ansi-categories",
  "users",
] as const;

export type TResource = (typeof RESOURCES)[number];

export type TActionPermissions = `${TAction}:${TResource}`;

export type TPermission = TVisibilityPermissions | TActionPermissions;

export const VALID_PERMISSIONS = [
  ...Object.values(VISIBILITY),
  ...PERMISSION_ACTIONS.flatMap((a) => RESOURCES.map((r) => `${a}:${r}`)),
] as const;

export const isValidPermission = (p: string): p is TPermission =>
  VALID_PERMISSIONS.includes(p as TPermission);
