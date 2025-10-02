import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { getAuthenticatedFetcher } from "~/.server/api-utils";
import { requireUserSession } from "~/.server/user-sesssion";
import ConfirmationDialog from "~/components/confirmation-dialog";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { useAuthenticatedFetch } from "~/hooks/use-authenticated-fetch";
import useConfirmAction from "~/hooks/use-confirm-action";
import { getMyOrganizationFn } from "~/lib/services/clients.service";
import { buildTitleFromBreadcrumb } from "~/lib/utils";
import type { Route } from "./+types/reset-demo-inspections";

export const handle = {
  breadcrumb: () => ({ label: "Clear Demo Inspections" }),
};

export const meta: Route.MetaFunction = ({ matches }) => {
  return [{ title: buildTitleFromBreadcrumb(matches) }];
};

export const loader = async ({ request }: Route.LoaderArgs) => {
  await requireUserSession(request);

  const fetcher = getAuthenticatedFetcher(request);
  const { client } = await getMyOrganizationFn(fetcher)();

  if (!client || !client.demoMode) {
    throw new Response("No demo client found for current user.", {
      status: 404,
    });
  }

  return {
    client,
  };
};

export default function ResetDemoInspections({ loaderData: { client } }: Route.ComponentProps) {
  return (
    <Card className="w-full max-w-md self-center">
      <CardHeader>
        <CardTitle>
          <Badge variant="outline">Demo Only</Badge>
          Reset Inspections – {client.name}
        </CardTitle>
        <CardDescription>
          Utilities for resetting inspections for the current demo client.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RenewNoncompliantDemoAssetsButton />
      </CardContent>
    </Card>
  );
}

const RenewNoncompliantDemoAssetsButton = () => {
  const { fetchOrThrow } = useAuthenticatedFetch();

  const [confirm, setConfirm] = useConfirmAction({
    defaultProps: {
      title: "Renew Non-Compliant Untagged Assets",
      message:
        "Are you sure you want to renew all non-compliant and untagged assets for the current demo client?",
    },
  });

  const {
    mutate: renewNoncompliantDemoAssetsMutation,
    isPending: renewNoncompliantDemoAssetsLoading,
  } = useMutation({
    mutationFn: async () => {
      const response = await fetchOrThrow(`/clients/renew-noncompliant-demo-assets`, {
        method: "POST",
      });
      return response.json();
    },
  });

  const handleRenew = () => {
    setConfirm((d) => {
      d.open = true;
      d.onConfirm = renewNoncompliantDemoAssetsMutation;
    });
  };

  return (
    <div className="flex w-full flex-col gap-1">
      <Button type="button" onClick={handleRenew} disabled={renewNoncompliantDemoAssetsLoading}>
        {renewNoncompliantDemoAssetsLoading && <Loader2 className="animate-spin" />}
        Renew Non-Compliant & Untagged Assets
      </Button>
      <p className="text-muted-foreground text-xs">
        This is used for keeping "presentation-only" assets (those used to improve the appearance of
        the dashboard but generally are not tagged) up to date.{" "}
        <span className="mt-2 block italic">
          Note: This process runs automatically every morning.
        </span>
      </p>
      <ConfirmationDialog {...confirm} />
    </div>
  );
};
