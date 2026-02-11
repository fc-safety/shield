import { data } from "react-router";
import { logger } from "~/.server/logger";
import { refreshUserSession } from "~/.server/user-sesssion";
import type { Route } from "./+types/switch-client";

interface SwitchClientRequest {
  clientId: string;
  siteId: string;
  roleId: string;
}

export const action = async ({ request }: Route.ActionArgs) => {
  const body = (await request.json()) as SwitchClientRequest;
  const { clientId, siteId } = body;

  const result = await refreshUserSession(request, { clientId, siteId });

  if (result.success) {
    return data({
      success: true,
      activeClientId: result.accessGrant?.clientId,
      activeSiteId: result.accessGrant?.siteId,
      scope: result.accessGrant?.scope,
      capabilities: result.accessGrant?.capabilities,
    });
  } else {
    logger.error(result.cause ?? new Error(result.message), "Failed to switch client");

    return data(
      {
        error: result.reason,
      },
      { status: 400 }
    );
  }
};
