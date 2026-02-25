import type { Updater } from "use-immer";
import type { ConfirmAction } from "~/hooks/use-confirm-action";
import type { Role } from "~/lib/types";

const MESSAGES = {
  GLOBAL: {
    invite: {
      title: "Invite with Global Admin Role",
      message:
        "Are you sure you want to invite this member with a global admin role? Doing so will give them full access to view and manage data for all clients.",
    },
    add: {
      title: "Add Global Admin Role",
      message:
        "Are you sure you want to add a global admin role? Doing so will give the member full access to view and manage data for all clients.",
    },
  },
  SYSTEM: {
    invite: {
      title: "Invite with System Admin Role",
      message:
        "Are you sure you want to invite this member with a system admin role? Doing so will give them full access to admin controls and the ability to view and manage data for all clients.",
    },
    add: {
      title: "Add System Admin Role",
      message:
        "Are you sure you want to add a system admin role? Doing so will give the member full access to admin controls and the ability to view and manage data for all clients.",
    },
  },
} as const;

/**
 * If the role has GLOBAL or SYSTEM scope, opens a confirmation dialog
 * and returns `true`. Otherwise returns `false` (caller should proceed).
 */
export function confirmHighPrivilegeRole({
  role,
  email,
  action,
  setAction,
  onConfirm,
}: {
  role: Role;
  email: string;
  action: "invite" | "add";
  setAction: Updater<ConfirmAction>;
  onConfirm: () => void;
}): boolean {
  if (role.scope !== "GLOBAL" && role.scope !== "SYSTEM") return false;

  const { title, message } = MESSAGES[role.scope][action];

  setAction((draft) => {
    draft.open = true;
    draft.title = title;
    draft.message = message;
    draft.requiredUserInput = email;
    draft.onConfirm = onConfirm;
  });

  return true;
}
