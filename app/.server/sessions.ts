import { createCookieSessionStorage } from "react-router";
import { createThemeSessionResolver } from "remix-themes";
import { authenticator, buildUser, type Tokens } from "./authenticator";
import { COOKIE_SECRET, SESSION_SECRET } from "./config";

const isProduction = process.env.NODE_ENV === "production";
const domain = process.env.APP_DOMAIN;

const themeSessionStorage = createCookieSessionStorage({
  cookie: {
    name: "__remix-themes",
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secrets: [COOKIE_SECRET],
    ...(isProduction ? { domain, secure: true } : {}),
  },
});

export const themeSessionResolver =
  createThemeSessionResolver(themeSessionStorage);

export const userSessionStorage = createCookieSessionStorage<{
  tokens?: Tokens | null;
}>({
  cookie: {
    name: "session",
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secrets: [SESSION_SECRET],
    ...(isProduction ? { domain, secure: true } : {}),
  },
});

export const getUserSession = async (request: Request) => {
  const session = await userSessionStorage.getSession(
    request.headers.get("cookie")
  );
  const tokens = session.get("tokens");
  if (!tokens) {
    return null;
  }

  // Get user, refreshing tokens if needed.
  const user = await buildUser(request, tokens);

  // If tokens are refreshed, make sure session is updated.
  session.set("tokens", {
    accessToken: user.tokens.accessToken,
    refreshToken: user.tokens.refreshToken,
  });

  // Return user with updated session token;
  return {
    user,
    sessionToken: await userSessionStorage.commitSession(session),
  };
};

export const setSessionTokens = async (request: Request, tokens: Tokens) => {
  const session = await userSessionStorage.getSession(
    request.headers.get("cookie")
  );
  session.set("tokens", tokens);
  return await userSessionStorage.commitSession(session);
};

export const requireUserSession = async (request: Request) => {
  const userSession = await getUserSession(request);
  if (!userSession) {
    throw await authenticator.authenticate("oauth2", request);
  }
  return userSession;
};
