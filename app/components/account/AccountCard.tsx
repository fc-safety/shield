import { ExternalLink, UserCog } from "lucide-react";
import { Link } from "react-router";
import type { User } from "~/.server/authenticator";
import DataList from "../data-list";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

export default function Account({ user }: { user: User }) {
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
