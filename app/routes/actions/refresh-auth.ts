import { redirect } from "react-router";
import { setCookieHeaderValue } from "~/.server/request-context";
import { refreshTokensOrRelogin, requireUserSession } from "~/.server/user-sesssion";
import { getSearchParam } from "~/lib/utils";
import type { Route } from "./+types/refresh-auth";

export const action = async ({ request }: Route.ActionArgs) => {
  const { user, session, getSessionToken } = await requireUserSession(request);

  user.tokens = await refreshTokensOrRelogin(request, session, user.tokens, {
    returnTo: getSearchParam(request, "returnTo") ?? undefined,
  });

  // Update session via request context, which will be picked up by the
  // session cookie middleware.
  const sessionToken = await getSessionToken(session);
  setCookieHeaderValue("authSession", sessionToken);

  return user;
};

export const loader = async ({ request }: Route.LoaderArgs) => {
  const returnTo = getSearchParam(request, "returnTo");
  return redirect(returnTo ?? "/");
};
