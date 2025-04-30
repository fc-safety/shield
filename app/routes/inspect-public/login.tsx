import { History, LogIn } from "lucide-react";
import { Form, Link } from "react-router";
import { getLoginRedirect } from "~/.server/sessions";
import { Button } from "~/components/ui/button";
import type { Route } from "./+types/login";
import ShieldBannerLogo from "./components/shield-banner-logo";

export const action = async ({ request }: Route.ActionArgs) => {
  return getLoginRedirect(request);
};

export default function PublicInspectLogin() {
  return (
    <div className="grid grow place-content-center">
      <div className="flex flex-col items-center gap-2 mb-12">
        <h1 className="text-xl font-normal italic">Welcome to</h1>
        <ShieldBannerLogo />
      </div>
      <div className="flex flex-col gap-4">
        <Form method="post">
          <Button type="submit" className="w-full">
            <LogIn /> Login to Inspect Asset
          </Button>
        </Form>
        <Button asChild variant="secondary">
          <Link to="../history">
            <History />
            View Inspection History
          </Link>
        </Button>
      </div>
    </div>
  );
}
