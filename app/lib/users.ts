import type { User } from "~/.server/authenticator";
import type { TVisibility } from "./permissions";

export function isGlobalAdmin(user: User) {
  return visibility(user) === "global";
}

export function visibility(user: User): TVisibility {
  const visibilityPermission = user.permissions?.find((p) =>
    p.startsWith("visibility:")
  );

  if (visibilityPermission) {
    return visibilityPermission.replace("visibility:", "") as TVisibility;
  }

  return "self";
}
