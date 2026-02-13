import { useMutation } from "@tanstack/react-query";
import { CheckCircle, Loader2, SendHorizonal } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "~/contexts/auth-context";
import { useAuthenticatedFetch } from "~/hooks/use-authenticated-fetch";
import { CAPABILITIES } from "~/lib/permissions";
import type { Member } from "~/lib/types";
import { buildPath } from "~/lib/urls";
import { can } from "~/lib/users";
import DataList from "../data-list";
import { Button } from "../ui/button";

interface SendResetPasswordEmailButtonProps {
  member: Member;
  clientId?: string;
  onSent?: () => void;
}

export default function SendResetPasswordEmailButton({
  member,
  clientId,
  onSent,
}: SendResetPasswordEmailButtonProps) {
  const { clientId: appClientId, user: currentUser } = useAuth();
  const { fetchOrThrow } = useAuthenticatedFetch();

  const canSendResetPasswordEmail = can(currentUser, CAPABILITIES.MANAGE_USERS);

  const {
    mutate: sendResetPasswordEmailMutation,
    isPending: sendResetPasswordEmailLoading,
    isSuccess: sendResetPasswordEmailSuccess,
  } = useMutation({
    mutationFn: async () => {
      await fetchOrThrow(
        buildPath(`/members/:id/reset-password-email`, {
          id: member.id,
          appClientId,
          clientId,
        }),
        {
          method: "POST",
          headers: {
            "x-view-context": "admin",
          },
        }
      );
      return true;
    },
    onSuccess: () => {
      toast.success("Password reset email sent successfully!");
      onSent?.();
    },
  });

  const memberName = `${member.firstName} ${member.lastName}`.trim();

  return (
    <div className="mt-4 flex flex-col gap-6">
      <DataList
        title="Member Details"
        details={[
          {
            label: "Name",
            value: memberName,
          },
          {
            label: "Email",
            value: member.email,
          },
          {
            label: "Position",
            value: member.position,
          },
        ]}
        defaultValue={<>&mdash;</>}
        fluid
        classNames={{
          details: "gap-1",
        }}
      />
      <div className="flex flex-col gap-4">
        <div>
          <h3 className="text-base font-semibold">
            Send Email To <span className="font-bold underline">{member.email}</span>
          </h3>
          <p className="text-muted-foreground text-xs">
            This will send a password reset email to the member. They will be able to reset their
            password using the link in the email.
          </p>
        </div>
        {!canSendResetPasswordEmail && (
          <p className="text-destructive text-center text-xs italic">
            You do not have permission to send password reset emails.
          </p>
        )}
        <Button
          type="button"
          onClick={() => sendResetPasswordEmailMutation()}
          disabled={
            sendResetPasswordEmailLoading ||
            sendResetPasswordEmailSuccess ||
            !canSendResetPasswordEmail
          }
        >
          {sendResetPasswordEmailLoading ? (
            <Loader2 className="animate-spin" />
          ) : sendResetPasswordEmailSuccess ? (
            <CheckCircle />
          ) : (
            <SendHorizonal />
          )}
          Send Password Reset Email
        </Button>
      </div>
    </div>
  );
}
