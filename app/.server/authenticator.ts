import { Authenticator } from "remix-auth";
import { OAuth2Strategy } from "remix-auth-oauth2";
import type { z } from "zod";
import { keycloakTokenPayloadSchema, parseToken } from "~/lib/users";
import { getSearchParams } from "~/lib/utils";
import { type TPermission } from "../lib/permissions";
import { CLIENT_ID, CLIENT_SECRET, ISSUER_URL, REDIRECT_URL } from "./config";

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
  permissions?: TPermission[];
  clientId: string;
  siteId: string;
  tokens: Tokens;
};

export const buildUser = (tokens: {
  accessToken: string | (() => string);
  refreshToken: string | (() => string);
}): User => {
  const retrieve = (value: string | (() => string)) =>
    typeof value === "string" ? value : value();
  const accessToken = retrieve(tokens.accessToken);
  const refreshToken = retrieve(tokens.refreshToken);

  const parsedToken = parseToken(accessToken, keycloakTokenPayloadSchema);

  return buildUserFromToken(parsedToken, { accessToken, refreshToken });
};

class KeycloakOAuth2Strategy<User> extends OAuth2Strategy<User> {
  override name = "keycloak-oauth2";

  protected authorizationParams(
    params: URLSearchParams,
    request: Request
  ): URLSearchParams {
    const newParams = super.authorizationParams(params, request);

    const queryParams = getSearchParams(request);
    if (queryParams.has("action")) {
      newParams.set("kc_action", queryParams.get("action")!);
    }

    return newParams;
  }
}

export const strategy = KeycloakOAuth2Strategy.discover<Tokens>(
  ISSUER_URL,
  {
    clientId: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
    redirectURI: REDIRECT_URL,
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

const buildUserFromToken = (
  payload: z.infer<typeof keycloakTokenPayloadSchema>,
  tokens: Tokens
): User => {
  return {
    idpId: payload.sub,
    email: payload.email,
    username: payload.preferred_username,
    name: payload.name,
    givenName: payload.given_name,
    familyName: payload.family_name,
    picture: payload.picture,
    permissions:
      payload.permissions ?? payload.resource_access?.["shield-api"]?.roles,
    clientId: payload.client_id,
    siteId: payload.site_id,
    tokens,
  };
};
