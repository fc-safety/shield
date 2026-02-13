import { CirclePlus } from "lucide-react";
import { useState } from "react";
import type z from "zod";
import { ResponsiveDialog } from "~/components/responsive-dialog";
import { Button } from "~/components/ui/button";
import { useAuth } from "~/contexts/auth-context";
import { useModalFetcher } from "~/hooks/use-modal-fetcher";
import type { Asset, Tag } from "~/lib/models";
import { CAPABILITIES } from "~/lib/permissions";
import type { updateTagSchema } from "~/lib/schema";
import { can } from "~/lib/users";
import RegisterTagAssistant from "~/routes/inspect/register/components/register-tag-assistant/register-tag-assistant.component";

type TRegisterForm = z.infer<typeof updateTagSchema>;

export default function EditableAssetDisplay({
  asset,
  tag,
}: {
  asset?: Pick<Asset, "id" | "name" | "placement" | "location">;
  tag: Pick<Tag, "id" | "serialNumber" | "externalId" | "siteId" | "clientId">;
}) {
  const { user } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);

  const canCreateTags = can(user, CAPABILITIES.MANAGE_ASSETS);
  const canRegiserTag = can(user, CAPABILITIES.MANAGE_ASSETS);
  const canProgramTags = can(user, CAPABILITIES.PROGRAM_TAGS);

  const [recentlyRegistered, setRecentlyRegistered] = useState(false);

  const { createOrUpdateJson: submitRegisterTag, isSubmitting } = useModalFetcher<TRegisterForm>();

  const handleSubmit = (data: TRegisterForm) => {
    setRecentlyRegistered(true);
    submitRegisterTag(data as any, {
      path: "/api/proxy/tags",
      id: tag.id,
    });
  };

  return (
    <div className="flex items-center gap-2">
      {asset ? (
        <div className="group flex items-center gap-2">
          {asset.name || `${asset.location} - ${asset.placement}`}
        </div>
      ) : canCreateTags && canProgramTags ? (
        <Button type="button" size="xs" onClick={() => setModalOpen(true)}>
          <CirclePlus /> Register
        </Button>
      ) : (
        <>&mdash;</>
      )}
      <ResponsiveDialog
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={
          <div className="flex items-center gap-1">
            <CirclePlus className="size-5" /> Registering tag to asset...
          </div>
        }
        description="Follow the steps below to register this tag to an asset."
        trigger={null}
        dialogClassName="sm:max-w-2xl"
        children={
          <div className="h-128">
            <RegisterTagAssistant
              canRegister={canRegiserTag}
              isRegistered={!!asset}
              isRegisteredRecently={recentlyRegistered}
              onRegister={(asset) =>
                handleSubmit({
                  client: { connect: { id: asset.clientId } },
                  site: { connect: { id: asset.siteId } },
                  asset: {
                    connect: {
                      id: asset.id,
                    },
                  },
                })
              }
              isRegistering={isSubmitting}
              siteId={tag.siteId}
              clientId={tag.clientId}
              onClose={() => setModalOpen(false)}
              hideInspectionPrompt
            />
          </div>
        }
      />
    </div>
  );
}
