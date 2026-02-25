import { Authenticator } from "remix-auth";
import { OAuth2Strategy } from "remix-auth-oauth2";
import { keycloakTokenPayloadSchema, parseToken } from "~/lib/users";
import { getSearchParams } from "~/lib/utils";
import type { TCapability, TScope } from "../lib/permissions";
import { config } from "./config";

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

export type User = {
  idpId: string;
  email: string;
  username: string;
  name?: string;
  givenName?: string;
  familyName?: string;
  picture?: string;
  scope: TScope;
  capabilities: TCapability[];
  hasMultiClientScope: boolean;
  hasMultiSiteScope: boolean;
  /** The currently selected/active client ID (may differ from token's clientId) */
  activeClientId: string | null;
  activeSiteId: string | null;
  tokens: Tokens;
};

export interface UserPermissions {
  scope: TScope;
  capabilities: TCapability[];
  hasMultiClientScope: boolean;
  hasMultiSiteScope: boolean;
  activeClientId: string | null;
  activeSiteId: string | null;
}

export const buildUser = (
  tokens: {
    accessToken: string | (() => string);
    refreshToken: string | (() => string);
  },
  permissions: UserPermissions
): User => {
  const retrieve = (value: string | (() => string)) =>
    typeof value === "string" ? value : value();
  const accessToken = retrieve(tokens.accessToken);
  const refreshToken = retrieve(tokens.refreshToken);

  const parsedToken = parseToken(accessToken, keycloakTokenPayloadSchema);

  return {
    idpId: parsedToken.sub,
    email: parsedToken.email,
    username: parsedToken.preferred_username,
    name: parsedToken.name,
    givenName: parsedToken.given_name,
    familyName: parsedToken.family_name,
    picture: parsedToken.picture,
    scope: permissions.scope,
    capabilities: permissions.capabilities,
    hasMultiClientScope: permissions.hasMultiClientScope,
    hasMultiSiteScope: permissions.hasMultiSiteScope,
    activeClientId: permissions.activeClientId,
    activeSiteId: permissions.activeSiteId,
    tokens: { accessToken, refreshToken },
  };
};

class KeycloakOAuth2Strategy<User> extends OAuth2Strategy<User> {
  override name = "keycloak-oauth2";

  protected authorizationParams(params: URLSearchParams, request: Request): URLSearchParams {
    const newParams = super.authorizationParams(params, request);

    const queryParams = getSearchParams(request);
    if (queryParams.has("action")) {
      newParams.set("kc_action", queryParams.get("action")!);
    }

    return newParams;
  }
}

export const strategy = KeycloakOAuth2Strategy.discover<Tokens>(
  config.ISSUER_URL,
  {
    clientId: config.CLIENT_ID,
    clientSecret: config.CLIENT_SECRET,
    redirectURI: config.REDIRECT_URL,
    scopes: ["openid", "email", "profile"], // optional
  },
  async ({ tokens }) => {
    return {
      accessToken: tokens.accessToken(),
      refreshToken: tokens.refreshToken(),
    };
  }
);

export const authenticator = strategy.then((s) => {
  const authn = new Authenticator<Tokens>();
  authn.use(s, "oauth2");
  return authn;
});
