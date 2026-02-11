import { data } from "react-router";
import { logger } from "~/.server/logger";
import { appStateSessionStorage, getSession } from "~/.server/sessions";
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

  let setCookieValue: string | undefined = undefined;

  if (result.success) {
    if (result.accessGrant) {
      const appStateSession = await getSession(request, appStateSessionStorage);
      appStateSession.set("activeAccessGrant", {
        clientId: result.accessGrant.clientId,
        siteId: result.accessGrant.siteId,
        roleId: result.accessGrant.roleId,
      });
      setCookieValue = await appStateSessionStorage.commitSession(appStateSession);
    }

    return data(
      {
        success: true,
        activeClientId: result.accessGrant?.clientId,
        activeSiteId: result.accessGrant?.siteId,
        scope: result.accessGrant?.scope,
        capabilities: result.accessGrant?.capabilities,
      },
      {
        headers: setCookieValue
          ? {
              "Set-Cookie": setCookieValue,
            }
          : undefined,
      }
    );
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
