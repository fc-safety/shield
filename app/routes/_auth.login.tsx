import { authenticator } from "~/.server/authenticator";
import type { Route } from "./+types/_auth.login";

export async function loader({ request }: Route.LoaderArgs) {
  await authenticator.authenticate("oauth2", request);
}
