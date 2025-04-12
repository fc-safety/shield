import { appStateSessionStorage } from "~/.server/sessions";
import type { Route } from "./+types/set-app-state";

export const action = async ({ request }: Route.ActionArgs) => {
  const appStateSession = await appStateSessionStorage.getSession(
    request.headers.get("cookie")
  );

  const data = await request.json();
  for (const [key, value] of Object.entries(data)) {
    appStateSession.set(key, value);
  }

  return new Response(null, {
    headers: {
      "Set-Cookie": await appStateSessionStorage.commitSession(appStateSession),
    },
  });
};
