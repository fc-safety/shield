import { Authenticator } from "remix-auth";
import { OAuth2Strategy } from "remix-auth-oauth2";
import { z } from "zod";
import { isValidPermission, type TPermission } from "../lib/permissions";
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

export const authenticator = new Authenticator<Tokens>();

export const buildUser = async (tokens: {
  accessToken: string | (() => string);
  refreshToken: string | (() => string);
}): Promise<User> => {
  const retrieve = (value: string | (() => string)) =>
    typeof value === "string" ? value : value();
  const accessToken = retrieve(tokens.accessToken);
  const refreshToken = retrieve(tokens.refreshToken);

  const parsedToken = JSON.parse(atob(accessToken.split(".")[1]));

  return buildUserFromToken(parsedToken, { accessToken, refreshToken });
};

export const strategy = OAuth2Strategy.discover<Tokens>(
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

strategy.then((s) => authenticator.use(s, "oauth2"));

const keycloakTokenPayloadSchema = z.object({
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
  client_id: z.string().default("unknown"),
  site_id: z.string().default("unknown"),
});

const buildUserFromToken = (input: unknown, tokens: Tokens): User => {
  const payload = keycloakTokenPayloadSchema.parse(input);
  return {
    idpId: payload.sub,
    email: payload.email,
    username: payload.preferred_username,
    name: payload.name,
    givenName: payload.given_name,
    familyName: payload.family_name,
    picture: payload.picture,
    permissions: payload.resource_access?.["shield-api"]?.roles,
    clientId: payload.client_id,
    siteId: payload.site_id,
    tokens,
  };
};
