import { logger } from "~/.server/logger";
import { userSessionStorage } from "~/.server/sessions";
import {
  applyAccessGrantToSession,
  commitUserSession,
  fetchCurrentUser,
} from "~/.server/user-sesssion";
import type { Route } from "./+types/switch-client";

interface SwitchClientRequest {
  clientId: string;
  siteId: string;
  roleId: string;
}

export const action = async ({ request }: Route.ActionArgs) => {
  const session = await userSessionStorage.getSession(request.headers.get("cookie"));

  const tokens = session.get("tokens");
  if (!tokens) {
    return new Response(JSON.stringify({ error: "Not authenticated" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const data = (await request.json()) as SwitchClientRequest;
  const { clientId, siteId, roleId } = data;

  if (!clientId || !siteId || !roleId) {
    return new Response(JSON.stringify({ error: "clientId, siteId, and roleId are required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Fetch fresh permissions from the backend
    const currentUser = await fetchCurrentUser(tokens.accessToken, { clientId, siteId });

    // Update session with new permissions, using request clientId/siteId as overrides
    let result: ReturnType<typeof applyAccessGrantToSession> | null = null;
    if (currentUser.accessGrant) {
      result = applyAccessGrantToSession(session, currentUser.accessGrant);
    } else {
      throw new Error("No access grant found for requested organization.");
    }

    // Commit the session
    await commitUserSession(session);

    return new Response(
      JSON.stringify({
        success: true,
        activeClientId: currentUser.accessGrant?.clientId ?? null,
        scope: result?.scope ?? null,
        capabilities: result?.capabilities ?? null,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    logger.error(error, "Failed to switch client");
    return new Response(JSON.stringify({ error: "Failed to switch client" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
