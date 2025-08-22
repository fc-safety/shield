import { Mail, MessageCircle, Phone, Search, type LucideIcon } from "lucide-react";
import { Link } from "react-router";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { openChat } from "~/lib/contact/utils";
import { buildTitleFromBreadcrumb } from "~/lib/utils";
import type { Route } from "./+types/contact-us";

export const handle = {
  breadcrumb: () => ({ label: "Contact Us" }),
};

export const meta: Route.MetaFunction = ({ matches }) => {
  return [{ title: buildTitleFromBreadcrumb(matches) }];
};

export default function ContactUs() {
  const handleOpenChat = () => {
    openChat();
  };

  return (
    <Card className="w-full max-w-2xl self-center">
      <CardHeader>
        <CardTitle className="justify-center text-2xl">We're here to help.</CardTitle>
        <CardDescription>
          If you have any questions or need assistance, please use any of the following methods to
          get the help you need:
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-[auto_1fr] items-center gap-x-6 gap-y-4 text-base">
          <CircleIcon icon={Mail} />
          <p>
            Email us at{" "}
            <a href="mailto:support@shield.com" className="text-primary underline">
              support@shield.com
            </a>
          </p>

          <CircleIcon icon={Phone} />
          <p>
            Call us at{" "}
            <a href="tel:+18005551234" className="text-primary underline">
              +1 (800) 555-1234
            </a>
          </p>

          <CircleIcon icon={MessageCircle} />
          <div>
            <Button onClick={handleOpenChat} variant="default" size="sm">
              Chat with us
            </Button>
          </div>

          <CircleIcon icon={Search} />
          <p>
            Search our{" "}
            <Link to="/faqs" className="text-primary underline">
              Frequently Asked Questions
            </Link>{" "}
            page or our{" "}
            <Link to="/docs" className="text-primary underline">
              Docs
            </Link>{" "}
            page.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function CircleIcon({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <div className="bg-primary/10 flex items-center justify-center rounded-full p-2">
      <Icon className="text-primary size-5" />
    </div>
  );
}
