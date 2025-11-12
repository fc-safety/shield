import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";
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
  const { client } = await getMyOrganizationFn(fetcher);

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
      <CardContent className="flex flex-col gap-4">
        <RenewNoncompliantDemoAssetsButton />
        <RegenerateInspectionHistoryButton client={client} />
      </CardContent>
    </Card>
  );
}

const RenewNoncompliantDemoAssetsButton = () => {
  return (
    <ResetAction
      confirmTitle="Are you sure you want to continue?"
      confirmMessage="This action will renew (i.e. automatially inspect and make compliant) all non-compliant and untagged assets for the current demo client."
      mutationPath="/clients/renew-noncompliant-demo-assets"
      buttonLabel="Renew Non-Compliant & Untagged Assets"
      actionDescription={
        <>
          This is used for keeping "presentation-only" assets (those used to improve the appearance
          of the dashboard but generally are not tagged) up to date.{" "}
          <span className="mt-2 block italic">
            Note: This process runs automatically every morning.
          </span>
        </>
      }
    />
  );
};

const RegenerateInspectionHistoryButton = ({ client }: { client: { id: string } }) => {
  return (
    <ResetAction
      confirmTitle="Are you sure you want to continue?"
      confirmMessage="This action will erase all inspections for the last 13 months and regenerate them."
      mutationPath="/clients/generate-demo-inspections"
      mutationMethod="POST"
      mutationBody={{
        clientId: client.id,
        monthsBack: 13,
        resetInspections: true,
      }}
      buttonLabel="Regenerate Inspection History"
      actionDescription={
        <>
          This is used for regenerating the inspection history for the last 13 months, which
          involves deleting those inspections and generating new ones.
        </>
      }
    />
  );
};

const ResetAction = ({
  confirmTitle,
  confirmMessage,
  mutationPath,
  mutationMethod = "POST",
  mutationBody,
  buttonLabel,
  actionDescription,
}: {
  confirmTitle: string;
  confirmMessage: string;
  mutationPath: string;
  mutationMethod?: "POST" | "PUT" | "DELETE";
  mutationBody?: Record<string, any>;
  buttonLabel: string;
  actionDescription: ReactNode;
}) => {
  const { fetchOrThrow } = useAuthenticatedFetch();

  const [confirm, setConfirm] = useConfirmAction({
    defaultProps: {
      title: confirmTitle,
      message: confirmMessage,
    },
  });

  const { mutate: doMutate, isPending } = useMutation({
    mutationFn: async () => {
      const response = await fetchOrThrow(mutationPath, {
        method: mutationMethod,
        body: mutationBody ? JSON.stringify(mutationBody) : undefined,
        headers: {
          "Content-Type": "application/json",
        },
      });
      return response.json();
    },
  });

  const handleAction = () => {
    setConfirm((d) => {
      d.open = true;
      d.onConfirm = doMutate;
    });
  };

  return (
    <div className="flex w-full flex-col gap-1">
      <Button type="button" onClick={handleAction} disabled={isPending}>
        {isPending && <Loader2 className="animate-spin" />}
        {buttonLabel}
      </Button>
      <p className="text-muted-foreground text-xs">{actionDescription}</p>
      <ConfirmationDialog {...confirm} />
    </div>
  );
};
