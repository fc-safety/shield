import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import {
  CheckCircle,
  Eye,
  EyeOff,
  Loader2,
  RotateCcwKey,
  SendHorizonal,
  SquareAsterisk,
} from "lucide-react";
import { forwardRef, useState, type ComponentProps } from "react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useAuth } from "~/contexts/auth-context";
import { useAuthenticatedFetch } from "~/hooks/use-authenticated-fetch";
import useConfirmAction from "~/hooks/use-confirm-action";
import { CAPABILITIES } from "~/lib/permissions";
import type { UserResponse } from "~/lib/types";
import { buildPath } from "~/lib/urls";
import { can } from "~/lib/users";
import { cn } from "~/lib/utils";
import ConfirmationDialog from "../confirmation-dialog";
import DataList from "../data-list";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { Field, FieldError, FieldLabel } from "../ui/field";
import { extractErrorMessage } from "../ui/form";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "../ui/input-group";

interface ResetPasswordFormProps {
  user: UserResponse;
  clientId?: string;
  onSubmitted: () => void;
}

export default function ResetPasswordForm({ user, clientId, onSubmitted }: ResetPasswordFormProps) {
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
        buildPath(`/users/:id/send-reset-password-email`, {
          id: user.id,
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
      onSubmitted();
    },
  });

  const form = useForm<TForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
      sendEmail: false,
    },
  });

  const {
    formState: { isValid },
  } = form;

  const [showPassword, setShowPassword] = useState(false);

  const { mutate: generatePasswordMutation, isPending: generatePasswordLoading } = useMutation({
    mutationFn: async () => {
      const response = await fetchOrThrow(buildPath(`/users/generate-password`, { length: 16 }));
      return response.json() as Promise<{ password: string }>;
    },
    onSuccess: (data) => {
      form.setValue("password", data.password, { shouldValidate: true });
      form.setValue("confirmPassword", data.password, { shouldValidate: true });
    },
  });

  const [resetPasswordAction, setResetPasswordAction] = useConfirmAction({});
  const {
    mutate: resetPasswordMutation,
    isPending: resetPasswordLoading,
    isSuccess: resetPasswordSuccess,
  } = useMutation({
    mutationFn: async (data: TForm) => {
      const response = await fetchOrThrow(
        buildPath(`/users/:id/reset-password`, {
          id: user.id,
          clientId,
        }),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-view-context": "admin",
          },
          body: JSON.stringify({ password: data.password, sendEmail: data.sendEmail }),
        }
      );

      if (!response.ok) {
        throw response;
      }

      return true;
    },
    onSuccess: () => {
      toast.success("Password reset successfully!");
      onSubmitted();
    },
  });

  const handleSubmit = (data: TForm) => {
    setResetPasswordAction((draft) => {
      draft.open = true;
      draft.title = "Reset Password";
      draft.message = `Are you sure you want to reset the password for ${user.name} (${user.email})?`;
      draft.onConfirm = () => {
        resetPasswordMutation(data);
      };
    });
  };

  return (
    <>
      <div className="mt-4 flex flex-col gap-8">
        <DataList
          title="User Details"
          details={[
            {
              label: "Name",
              value: user.name,
            },
            {
              label: "Email",
              value: user.email,
            },
            {
              label: "Position",
              value: user.position,
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
              Send Email To <span className="font-bold underline">{user.email}</span>
            </h3>
            <p className="text-muted-foreground text-xs">
              This will send a password reset email to the user. The user will be able to reset
              their password using the link in the email.
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
        <FormProvider {...form}>
          <form
            className="flex flex-col gap-4"
            onSubmit={form.handleSubmit(handleSubmit, (e) => {
              toast.error("Please fix the errors in the form.", {
                description: extractErrorMessage(e),
                duration: 10000,
              });
            })}
          >
            <div>
              <h3 className="text-base font-semibold">Manually Reset Password</h3>
              <p className="text-muted-foreground text-xs">
                Manually reset the password for the user. This will overwrite any password the user
                has set. You can optionally choose to send the new password to the user&apos;s
                email.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => generatePasswordMutation()}
                disabled={generatePasswordLoading}
              >
                <RotateCcwKey className={cn(generatePasswordLoading && "animate-spin")} />
                Generate Secure Password
              </Button>

              <Controller
                control={form.control}
                name="password"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Password</FieldLabel>
                    <PasswordInput
                      showPassword={showPassword}
                      onShowPassword={setShowPassword}
                      {...field}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name="confirmPassword"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Confirm Password</FieldLabel>
                    <PasswordInput
                      showPassword={showPassword}
                      onShowPassword={setShowPassword}
                      {...field}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              {canSendResetPasswordEmail && (
                <Controller
                  control={form.control}
                  name="sendEmail"
                  render={({ field: { onChange, value, ...field }, fieldState }) => (
                    <Field data-invalid={fieldState.invalid} orientation="horizontal">
                      <Checkbox {...field} checked={value} onCheckedChange={onChange} />
                      <FieldLabel className="font-normal">
                        Send email with new password to{" "}
                        <span className="font-bold underline">{user.email}</span>
                      </FieldLabel>
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
              )}
            </div>

            <Button type="submit" disabled={resetPasswordLoading || resetPasswordSuccess}>
              {resetPasswordLoading ? (
                <Loader2 className="animate-spin" />
              ) : resetPasswordSuccess ? (
                <CheckCircle />
              ) : (
                <SquareAsterisk />
              )}
              Reset Password
            </Button>
          </form>
        </FormProvider>
      </div>
      <ConfirmationDialog {...resetPasswordAction} />
    </>
  );
}

const PasswordInput = forwardRef<
  HTMLInputElement,
  Omit<ComponentProps<"input">, "type"> & {
    showPassword: boolean;
    onShowPassword: (showPassword: boolean) => void;
  }
>(({ showPassword, onShowPassword, className, ...props }, ref) => {
  return (
    <InputGroup>
      <InputGroupInput
        type={showPassword ? "text" : "password"}
        className={cn("pr-10", className)}
        {...props}
        ref={ref}
      />
      <InputGroupAddon align="inline-end">
        <InputGroupButton
          type="button"
          size="icon-xs"
          onClick={() => onShowPassword(!showPassword)}
          tabIndex={-1}
        >
          {showPassword ? <EyeOff /> : <Eye />}
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
});

PasswordInput.displayName = "PasswordInput";

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    sendEmail: z.boolean(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

type TForm = z.infer<typeof resetPasswordSchema>;
