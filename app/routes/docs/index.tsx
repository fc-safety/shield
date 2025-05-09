import { Link } from "react-router";
import { requireUserSession } from "~/.server/user-sesssion";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { isGlobalAdmin } from "~/lib/users";
import type { Route } from "./+types/index";
import { Paragraph } from "./components/Paragraph";

export const loader = async ({ request }: Route.LoaderArgs) => {
  const { user } = await requireUserSession(request);
  const userIsGlobalAdmin = isGlobalAdmin(user);

  const docLinks: {
    label: string;
    href: string;
    hidden?: boolean;
  }[] = [
    {
      label: "Writing NFC Tags",
      href: "/docs/writing-nfc-tags",
      hidden: !userIsGlobalAdmin,
    },
  ];

  return {
    docLinks: docLinks.filter((link) => !link.hidden),
  };
};

export default function Docs({
  loaderData: { docLinks },
}: Route.ComponentProps) {
  return (
    <Card className="max-w-prose self-center">
      <CardHeader>
        <CardTitle>Docs</CardTitle>
        <CardDescription>
          This section contains documentation for the Shield project. Here you
          will find guides and tutorials for using the Shield project.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="list-disc pl-10">
          {docLinks.map((link) => (
            <li key={link.href}>
              <Button variant="link" asChild>
                <Link to={link.href}>{link.label}</Link>
              </Button>
            </li>
          ))}
        </ul>

        {docLinks.length === 0 && (
          <Paragraph>No documentation available.</Paragraph>
        )}
      </CardContent>
    </Card>
  );
}
