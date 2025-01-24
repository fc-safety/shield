import { authenticator } from "~/.server/authenticator";
import type { Route } from "./+types/login";

export async function loader({ request }: Route.LoaderArgs) {
  await authenticator.then((a) => a.authenticate("oauth2", request));
}
