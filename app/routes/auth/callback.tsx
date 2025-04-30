import { redirect } from "react-router";
import { authenticator, type Tokens } from "~/.server/authenticator";
import { requestContext } from "~/.server/request-context";
import { userSessionStorage } from "~/.server/sessions";
import type { Route } from "./+types/callback";

export async function loader({ request }: Route.LoaderArgs) {
  let tokens: Tokens;
  try {
    tokens = await authenticator.then((a) => a.authenticate("oauth2", request));
  } catch (e) {
    return redirect("/login");
  }

  const session = await userSessionStorage.getSession(
    request.headers.get("cookie")
  );
  session.set("tokens", tokens);

  const returnTo = session.get("returnTo") ?? "/";
  session.unset("returnTo");

  // Clear any existing middleware set cookie values.
  requestContext.set("setCookieHeaderValues", (values) => {
    const newValues = { ...values };
    delete newValues.authSession;
    return newValues;
  });

  const headers = new Headers({
    "Set-Cookie": await userSessionStorage.commitSession(session),
  });

  return redirect(returnTo, { headers });
}
