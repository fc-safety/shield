import { Info, Nfc } from "lucide-react";
import type { User } from "~/.server/authenticator";
import useMyOrganization from "~/hooks/use-my-organization";
import type { GetMyOrganizationResult } from "~/lib/services/clients.service";
import { getUserDisplayName, isGlobalAdmin } from "~/lib/users";
import DataList from "../data-list";
import DefaultErrorBoundary from "../default-error-boundary";

export default function InspectErrorBoundary({
  error,
  user: userProp,
}: {
  error: unknown;
  user?: User;
}) {
  let client: GetMyOrganizationResult["client"] | undefined;
  let site: GetMyOrganizationResult["site"] | undefined;
  let user: User | undefined = userProp;
  try {
    const orgProps = useMyOrganization();
    client = orgProps.client;
    site = orgProps.site;
    if (!user) {
      user = orgProps.user;
    }
  } catch (e) {}

  return (
    <DefaultErrorBoundary
      error={error}
      homeTo="/"
      homeToText="Go to dashboard"
      errorTitle="Oops!"
      errorSubtitle="Something didn&#39;t work."
    >
      <div className="my-4 flex w-full max-w-sm flex-col items-center gap-4 text-center">
        <p className="flex items-center justify-center text-base font-bold">
          Try again or scan a different tag.
          <Nfc className="text-primary inline size-4" />
        </p>

        {client?.demoMode && (
          <div className="border-primary bg-primary/10 text-primary flex w-full flex-col gap-2 rounded-md border px-4 py-2 text-start">
            <h4 className="text-sm font-semibold">
              <Info className="mr-1 inline size-4" />
              You are logged into a <span className="underline">demo</span> user account.
            </h4>
            <DataList
              variant="fluid"
              classNames={{
                container: "gap-2",
                details: "gap-0 gap-x-2 gap-y-1",
                detailLabel: "text-inherit font-bold text-xs",
                detailValue: "text-xs",
              }}
              details={[
                { label: "Email:", value: user?.email || "No user info." },
                {
                  label: "Name:",
                  value: (user && getUserDisplayName(user)) || "No user info.",
                },
                {
                  label: "Client:",
                  value: client?.name || "No client info.",
                },
                {
                  label: "Site:",
                  value: site?.name || "No site info.",
                },
              ]}
            />
          </div>
        )}

        {user && isGlobalAdmin(user) && (
          <p className="text-muted-foreground text-xs font-semibold">
            Note for admins: You can only inspect assets belonging to your own client.
          </p>
        )}
      </div>
    </DefaultErrorBoundary>
  );
}
