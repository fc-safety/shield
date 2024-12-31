import { Authenticator } from "remix-auth";
import { OAuth2Strategy } from "remix-auth-oauth2";
import { CLIENT_ID, CLIENT_SECRET, ISSUER_URL, USERINFO_URL } from "./config";

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

export interface User {
  sub: string;
  name: string;
  preferred_username: string;
  given_name: string;
  family_name: string;
  email: string;
  tokens: Tokens;
}

export const authenticator = new Authenticator<Tokens>();

export const buildUser = async (
  request: Request,
  tokens: {
    accessToken: string | (() => string);
    refreshToken: string | (() => string);
  }
): Promise<User> => {
  const retrieve = (value: string | (() => string)) =>
    typeof value === "string" ? value : value();
  let accessToken = retrieve(tokens.accessToken);
  let refreshToken = retrieve(tokens.refreshToken);

  const getUserInfo = async (_accessToken: string) =>
    fetch(USERINFO_URL, {
      headers: {
        Authorization: `Bearer ${_accessToken}`,
      },
    });

  let response = await getUserInfo(accessToken);

  if (response.status === 401) {
    try {
      const refreshedTokens = await strategy.then((s) =>
        s.refreshToken(refreshToken)
      );
      accessToken = refreshedTokens.accessToken();
      refreshToken = refreshedTokens.refreshToken();
    } catch (e) {
      console.error("Token refresh failed", e);
      throw await authenticator.authenticate("oauth2", request);
    }
    response = await getUserInfo(accessToken);
  }

  if (!response.ok) {
    throw new Error(response.statusText);
  }

  const user = await response.json();
  return {
    ...user,
    tokens: {
      accessToken,
      refreshToken,
    },
  } satisfies User;
};

export const strategy = OAuth2Strategy.discover<Tokens>(
  ISSUER_URL,
  {
    clientId: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
    redirectURI: "http://localhost:5173/callback",
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
