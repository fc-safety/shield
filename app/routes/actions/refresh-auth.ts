import { redirect } from "react-router";
import { commitUserSession, requireUserSession } from "~/.server/user-sesssion";
import { getSearchParam } from "~/lib/utils";
import type { Route } from "./+types/refresh-auth";

export const action = async ({ request }: Route.ActionArgs) => {
  const { user, session } = await requireUserSession(request, {
    returnTo: getSearchParam(request, "returnTo") ?? undefined,
  });

  // requireUserSession already refreshes tokens if expired, so we can just
  // return the user with the updated tokens. The deduplication in
  // refreshTokensOrRelogin ensures that even if multiple parallel requests
  // call this action simultaneously, only one token refresh will occur.

  // Commit user session by setting the auth session cookie.
  await commitUserSession(session);

  return user;
};

export const loader = async ({ request }: Route.LoaderArgs) => {
  const returnTo = getSearchParam(request, "returnTo");
  return redirect(returnTo ?? "/");
};
