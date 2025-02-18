import { refreshTokensOrRelogin, requireUserSession } from "~/.server/sessions";
import { getSearchParam } from "~/lib/utils";
import type { Route } from "./+types/refresh-auth";

export const action = async ({ request }: Route.ActionArgs) => {
  const { user, session, getSessionToken } = await requireUserSession(request);

  user.tokens = await refreshTokensOrRelogin(request, session, user.tokens, {
    returnTo: getSearchParam(request, "returnTo") ?? undefined,
  });

  const resHeaders = new Headers({});
  resHeaders.append("Set-Cookie", await getSessionToken(session));

  return user;
};
