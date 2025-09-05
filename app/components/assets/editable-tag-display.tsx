import { useMutation } from "@tanstack/react-query";
import { CirclePlus, Link, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "~/contexts/auth-context";
import { useAuthenticatedFetch } from "~/hooks/use-authenticated-fetch";
import type { Asset, Tag } from "~/lib/models";
import { can } from "~/lib/users";
import { cn } from "~/lib/utils";
import TagAssistant from "~/routes/admin/tags/components/tag-assistant/tag-assistant";
import { generateSignedTagUrl } from "~/routes/admin/tags/services/tags.service";
import { CopyableText } from "../copyable-text";
import { ResponsiveDialog } from "../responsive-dialog";
import { Button } from "../ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";

export default function EditableTagDisplay({
  asset,
  tag,
  variant = "default",
}: {
  asset?: Pick<Asset, "id" | "siteId" | "clientId">;
  tag: Pick<Tag, "serialNumber" | "externalId"> | null | undefined;
  variant?: "default" | "compact";
}) {
  const { user } = useAuth();
  const { fetchOrThrow } = useAuthenticatedFetch();
  const [modelOpen, setModelOpen] = useState(false);

  const canCreateTags = can(user, "create", "tags");
  const canProgramTags = can(user, "program", "tags");

  const { mutate: handleCopyTagUrl, isPending: isCopyingTagUrl } = useMutation({
    mutationFn: ({ serialNumber, externalId }: { serialNumber: string; externalId: string }) =>
      generateSignedTagUrl(fetchOrThrow, serialNumber, externalId),
    onSuccess: (data) => {
      navigator.clipboard.writeText(data.tagUrl).then(() => {
        toast.success("Copied tag's inspection URL to clipboard!");
      });
    },
  });

  return (
    <div className="flex items-center gap-2">
      {tag ? (
        <div className="group flex items-center gap-2">
          <CopyableText text={tag.serialNumber} compact={variant === "compact"} />
          {canProgramTags && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    type="button"
                    size="iconSm"
                    className={cn("text-muted-foreground h-7 w-7")}
                    onClick={() =>
                      handleCopyTagUrl({
                        serialNumber: tag.serialNumber,
                        externalId: tag.externalId,
                      })
                    }
                    disabled={isCopyingTagUrl}
                  >
                    {isCopyingTagUrl ? <Loader2 className="animate-spin" /> : <Link />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Copy Tag URL</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      ) : canCreateTags && canProgramTags && asset ? (
        <Button type="button" size="xs" onClick={() => setModelOpen(true)}>
          <CirclePlus /> Register
        </Button>
      ) : (
        <>&mdash;</>
      )}
      <ResponsiveDialog
        open={modelOpen}
        onOpenChange={setModelOpen}
        title={
          <div className="flex items-center gap-2">
            <CirclePlus className="size-4" /> Register Asset Tag
          </div>
        }
        description="Follow the steps below to register a new tag to this asset."
        trigger={null}
        dialogClassName="sm:max-w-2xl"
        children={
          <div className="h-[32rem]">
            {asset ? (
              <TagAssistant assetToRegister={asset} onClose={() => setModelOpen(false)} />
            ) : (
              <>Something went wrong. No asset found.</>
            )}
          </div>
        }
      />
    </div>
  );
}
