import { History, LogIn } from "lucide-react";
import { Form, Link } from "react-router";
import { validateInspectionSession } from "~/.server/inspections";
import { getLoginRedirect } from "~/.server/user-sesssion";
import { Button } from "~/components/ui/button";
import { buildTitleFromBreadcrumb } from "~/lib/utils";
import type { Route } from "./+types/login";
import ShieldBannerLogo from "./components/shield-banner-logo";

export const handle = {
  breadcrumb: () => ({ label: "Welcome" }),
};

export const meta: Route.MetaFunction = ({ matches }) => {
  return [{ title: buildTitleFromBreadcrumb(matches) }];
};

export const action = async ({ request }: Route.ActionArgs) => {
  return getLoginRedirect(request);
};

export const loader = async ({ request }: Route.LoaderArgs) => {
  await validateInspectionSession(request);

  return null;
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
