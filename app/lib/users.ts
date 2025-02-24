import { z } from "zod";
import type { User } from "~/.server/authenticator";
import {
  isValidPermission,
  type TAction,
  type TResource,
  type TVisibility,
} from "./permissions";

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

export class TokenParseError extends Error {
  constructor(message: string, cause?: Error) {
    super(message, { cause });
    this.name = "TokenParseError";
  }
}

export const keycloakTokenPayloadSchema = z.object({
  exp: z.number(),
  sub: z.string(),
  email: z.string(),
  preferred_username: z.string(),
  name: z.string().optional(),
  given_name: z.string().optional(),
  family_name: z.string().optional(),
  picture: z.string().optional(),
  resource_access: z
    .record(
      z.string(),
      z.object({
        roles: z
          .array(z.string())
          .transform((roles) => roles.filter(isValidPermission)),
      })
    )
    .optional(),
  permissions: z
    .array(z.string())
    .transform((roles) => roles.filter(isValidPermission))
    .optional(),
  client_id: z.string().default("unknown"),
  site_id: z.string().default("unknown"),
});

export const parseToken = <S extends z.Schema>(
  token: string,
  schema: S
): z.infer<S> => {
  try {
    const parsedTokenRaw = JSON.parse(atob(token.split(".")[1]));
    return schema.parse(parsedTokenRaw);
  } catch (error) {
    throw new TokenParseError(String(error), error as Error);
  }
};

export const isTokenExpired = (
  token: string,
  bufferSeconds = DEFAULT_TOKEN_EXPIRATION_BUFFER_SECONDS
) => {
  try {
    const parsedToken = parseToken(
      token,
      keycloakTokenPayloadSchema.pick({ exp: true })
    );
    return (parsedToken.exp - bufferSeconds) * 1000 < Date.now();
  } catch (error) {
    if (error instanceof TokenParseError) {
      return true;
    }
    throw error;
  }
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
  if (
    ["create", "update", "read", "delete"].includes(action) &&
    can(user, "manage", resource)
  ) {
    return true;
  }
  return !!user.permissions?.includes(`${action}:${resource}`);
}
