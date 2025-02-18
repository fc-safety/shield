import type { User } from "~/.server/authenticator";
import type { TAction, TResource, TVisibility } from "./permissions";

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

const DEFAULT_TOKEN_EXPIRATION_BUFFER_SECONDS = 2;

export const isTokenExpired = (
  token: string,
  bufferSeconds = DEFAULT_TOKEN_EXPIRATION_BUFFER_SECONDS
) => {
  const parsedToken = JSON.parse(atob(token.split(".")[1]));
  return (parsedToken.exp - bufferSeconds) * 1000 < Date.now();
};

export function getUserDisplayName(user: {
  firstName?: string;
  lastName?: string;
  givenName?: string;
  familyName?: string;
}) {
  return `${user.firstName ?? user.givenName ?? ""} ${
    user.lastName ?? user.familyName ?? ""
  }`.trim();
}

export function can(user: User, action: TAction, resource: TResource) {
  return !!user.permissions?.includes(`${action}:${resource}`);
}
