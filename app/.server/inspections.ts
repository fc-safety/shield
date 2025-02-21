import { redirect } from "react-router";
import { inspectionSessionStorage } from "~/.server/sessions";
import { getSearchParam } from "../lib/utils";

export const validateTagId = async (request: Request, redirectTo: string) => {
  let extId = getSearchParam(request, "extId");
  const inspectionSession = await inspectionSessionStorage.getSession(
    request.headers.get("cookie")
  );

  if (extId) {
    inspectionSession.set("activeTag", extId);
    throw redirect(redirectTo, {
      headers: {
        "Set-Cookie": await inspectionSessionStorage.commitSession(
          inspectionSession
        ),
      },
    });
  }
  extId = inspectionSession.get("activeTag") ?? null;

  if (!extId) {
    throw new Response("No tag ID provided.", {
      status: 400,
    });
  }

  return extId;
};
