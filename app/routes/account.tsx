import { ExternalLink, UserCog } from "lucide-react";
import { Link } from "react-router";
import { requireUserSession } from "~/.server/sessions";
import DataList from "~/components/data-list";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { buildTitleFromBreadcrumb } from "~/lib/utils";
import type { Route } from "./+types/account";

export const handle = {
  breadcrumb: () => ({ label: "Account" }),
};

export const meta: Route.MetaFunction = ({ matches }) => {
  return [{ title: buildTitleFromBreadcrumb(matches) }];
};

export const loader = async ({ request }: Route.LoaderArgs) => {
  const { user } = await requireUserSession(request);
  return { user };
};

export default function Account({
  loaderData: { user },
}: Route.ComponentProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <UserCog /> Account
        </CardTitle>
      </CardHeader>
      <CardContent>
        <DataList
          className="w-max"
          details={[
            { label: "Name", value: user.name },
            { label: "Username", value: user.username },
            { label: "Email", value: user.email },
            {
              label: "Password",
              value: (
                <Button
                  variant="link"
                  className="p-0 leading-none h-min"
                  asChild
                >
                  <Link to="/login?action=UPDATE_PASSWORD" target="_blank">
                    Change Password
                    <ExternalLink />
                  </Link>
                </Button>
              ),
            },
            {
              label: "Passkey",
              value: (
                <Button
                  variant="link"
                  className="p-0 leading-none h-min"
                  asChild
                >
                  <Link
                    to="/login?action=webauthn-register-passwordless"
                    target="_blank"
                  >
                    Configure Passkey
                    <ExternalLink />
                  </Link>
                </Button>
              ),
            },
            {
              label: "Authenticator",
              value: (
                <Button
                  variant="link"
                  className="p-0 leading-none h-min"
                  asChild
                >
                  <Link to="/login?action=CONFIGURE_TOTP" target="_blank">
                    Configure Authenticator
                    <ExternalLink />
                  </Link>
                </Button>
              ),
            },
          ]}
          defaultValue={<>&mdash;</>}
        />
      </CardContent>
    </Card>
  );
}
