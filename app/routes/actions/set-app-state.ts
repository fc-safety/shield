import { appStateSessionStorage } from "~/.server/sessions";
import type { AppState } from "~/lib/types";
import type { Route } from "./+types/set-app-state";

export const action = async ({ request }: Route.ActionArgs) => {
  const appStateSession = await appStateSessionStorage.getSession(
    request.headers.get("cookie")
  );

  const data = (await request.json()) as Partial<AppState>;
  for (const [key, value] of Object.entries(data)) {
    appStateSession.set(key as keyof AppState, value);
  }

  return new Response(null, {
    headers: {
      "Set-Cookie": await appStateSessionStorage.commitSession(appStateSession),
    },
  });
};
