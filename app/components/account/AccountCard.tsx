import { ExternalLink, UserCog } from "lucide-react";
import { Link } from "react-router";
import type { User } from "~/.server/authenticator";
import useMyOrganization from "~/hooks/use-my-organization";
import DataList from "../data-list";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

export default function Account({ user }: { user: User }) {
  const { client, site } = useMyOrganization();

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <UserCog /> Account
        </CardTitle>
      </CardHeader>
      <CardContent>
        <DataList
          classNames={{
            container: "w-max",
          }}
          details={[
            { label: "Name", value: user.name },
            { label: "Username", value: user.username },
            { label: "Email", value: user.email },
            { label: "Client", value: client?.name || "No client info." },
            { label: "Site", value: site?.name || "No site info." },
            {
              label: "Password",
              value: (
                <Button
                  variant="link"
                  className="h-min p-0 py-0 leading-none has-[>svg]:px-0"
                  asChild
                >
                  <Link
                    to="/login?action=UPDATE_PASSWORD"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
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
                  className="h-min p-0 py-0 leading-none has-[>svg]:px-0"
                  asChild
                >
                  <Link
                    to="/login?action=webauthn-register-passwordless"
                    target="_blank"
                    rel="noopener noreferrer"
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
                  className="h-min p-0 py-0 leading-none has-[>svg]:px-0"
                  asChild
                >
                  <Link to="/login?action=CONFIGURE_TOTP" target="_blank" rel="noopener noreferrer">
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
