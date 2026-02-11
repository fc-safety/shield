import { useState } from "react";
import { redirect } from "react-router";
import type { z } from "zod";
import { api } from "~/.server/api";
import { catchResponse } from "~/.server/api-utils";
import { guard } from "~/.server/guard";
import { validateInspectionSession } from "~/.server/inspections";
import { refreshUserSession } from "~/.server/user-sesssion";
import InspectErrorBoundary from "~/components/inspections/inspect-error-boundary";
import { useAuth } from "~/contexts/auth-context";
import { useModalFetcher } from "~/hooks/use-modal-fetcher";
import type { AssetQuestion } from "~/lib/models";
import { CAPABILITIES } from "~/lib/permissions";
import { registerTagSchema } from "~/lib/schema";
import { can } from "~/lib/users";
import { buildTitleFromBreadcrumb } from "~/lib/utils";
import type { Route } from "./+types/index";
import RegisterTagAssistant from "./components/register-tag-assistant/register-tag-assistant.component";

export const handle = {
  breadcrumb: () => ({ label: "Register Tag" }),
};

export const meta: Route.MetaFunction = ({ matches }) => {
  return [{ title: buildTitleFromBreadcrumb(matches) }];
};

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const { user } = useAuth();
  return (
    <main className="grid grow place-items-center px-6 py-24 sm:py-32 lg:px-8">
      <InspectErrorBoundary error={error} user={user} />
    </main>
  );
}

export const loader = async ({ request }: Route.LoaderArgs) => {
  const { inspectionToken } = await validateInspectionSession(request);
  const user = await guard(request, (user) => can(user, CAPABILITIES.REGISTER_TAGS));

  const {
    data: { data: tagWithAccessContext },
  } = await catchResponse(api.tags.checkRegistration(request, inspectionToken), {
    codes: [404],
  });

  const { tag, accessContext } = tagWithAccessContext ?? {};

  // Set auto-discovered access grant context. This prevents users from
  // needing to manually select the correct access grant.
  if (
    accessContext &&
    (accessContext.clientId !== user.activeClientId || accessContext.siteId !== user.activeSiteId)
  ) {
    await refreshUserSession(request, {
      clientId: accessContext.clientId,
      siteId: accessContext.siteId,
      roleId: accessContext.roleId,
    });
    // Reload page with new access grant context.
    throw redirect(request.url);
  }

  let setupQuestions: AssetQuestion[] = [];
  if (tag?.asset && tag.asset.setupOn === null) {
    setupQuestions = await api.assetQuestions.findByAsset(request, tag.asset.id, "SETUP");
  }

  return { tag, inspectionToken, setupQuestions };
};

type TRegisterForm = z.infer<typeof registerTagSchema>;

export default function InspectRegister({
  loaderData: { tag, inspectionToken, setupQuestions },
}: Route.ComponentProps) {
  const { user } = useAuth();
  const canRegister =
    can(user, CAPABILITIES.REGISTER_TAGS) && can(user, CAPABILITIES.MANAGE_ASSETS);

  const [recentlyRegistered, setRecentlyRegistered] = useState(false);

  const { submitJson: submitRegisterTag, isSubmitting } = useModalFetcher<TRegisterForm>();

  const handleSubmit = (data: TRegisterForm) => {
    setRecentlyRegistered(true);
    submitRegisterTag(data as any, {
      method: "POST",
      path: "/api/proxy/tags/register-tag",
      query: {
        _inspectionToken: inspectionToken,
      },
    });
  };

  return (
    <div className="my-8 flex h-full w-full max-w-sm flex-col items-center justify-center self-center">
      <div className="h-168 max-h-[calc(100dvh-10rem)] w-full">
        <RegisterTagAssistant
          assetId={tag?.asset?.id}
          canRegister={canRegister}
          isRegistered={!!tag?.asset}
          isRegisteredRecently={recentlyRegistered}
          onRegister={(asset) =>
            handleSubmit({
              client: undefined,
              site: undefined,
              asset: {
                connect: {
                  id: asset.id,
                },
              },
            })
          }
          isRegistering={isSubmitting}
          setupRequired={setupQuestions.length > 0 && tag?.asset?.setupOn === null}
          setupQuestions={setupQuestions}
        />
      </div>
    </div>
  );
}
