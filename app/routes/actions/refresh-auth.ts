import { refreshTokensOrRelogin, requireUserSession } from "~/.server/sessions";
import type { Route } from "./+types/refresh-auth";

export const action = async ({ request }: Route.ActionArgs) => {
  const { user, session, getSessionToken } = await requireUserSession(request);

  user.tokens = await refreshTokensOrRelogin(request, session, user.tokens);

  const resHeaders = new Headers({});
  resHeaders.append("Set-Cookie", await getSessionToken(session));

  return user;
};
