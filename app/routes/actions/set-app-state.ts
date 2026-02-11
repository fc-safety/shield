import { setAppState } from "~/.server/sessions";
import type { AppState } from "~/lib/types";
import type { Route } from "./+types/set-app-state";

export const action = async ({ request }: Route.ActionArgs) => {
  const data = (await request.json()) as Partial<AppState>;
  await setAppState(request, data);
  return null;
};
