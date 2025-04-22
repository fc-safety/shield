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
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useAuth } from "~/contexts/auth-context";
import { useAuthenticatedFetch } from "~/hooks/use-authenticated-fetch";
import useConfirmAction from "~/hooks/use-confirm-action";
import type { ClientUser } from "~/lib/types";
import { buildPath } from "~/lib/urls";
import { cn } from "~/lib/utils";
import ConfirmationDialog from "../confirmation-dialog";
import DataList from "../data-list";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";

interface ResetPasswordFormProps {
  user: ClientUser;
  clientId: string;
  onSubmitted: () => void;
}

export default function ResetPasswordForm({
  user,
  clientId,
  onSubmitted,
}: ResetPasswordFormProps) {
  const { clientId: appClientId } = useAuth();
  const { fetchOrThrow } = useAuthenticatedFetch();

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

  const {
    mutate: generatePasswordMutation,
    isPending: generatePasswordLoading,
  } = useMutation({
    mutationFn: async () => {
      const response = await fetchOrThrow(
        buildPath(`/users/generate-password`, { length: 16 })
      );
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
          body: JSON.stringify(data),
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
      <div className="flex flex-col gap-8 mt-4">
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
              Send Email To{" "}
              <span className="font-bold underline">{user.email}</span>
            </h3>
            <p className="text-xs text-muted-foreground">
              This will send a password reset email to the user. The user will
              be able to reset their password using the link in the email.
            </p>
          </div>
          <Button
            type="button"
            onClick={() => sendResetPasswordEmailMutation()}
            disabled={
              sendResetPasswordEmailLoading || sendResetPasswordEmailSuccess
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
            onSubmit={form.handleSubmit(handleSubmit)}
          >
            <div>
              <h3 className="text-base font-semibold">
                Manually Reset Password
              </h3>
              <p className="text-xs text-muted-foreground">
                Manually reset the password for the user. This will overwrite
                any password the user has set. You can optionally choose to send
                the new password to the user&apos;s email.
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
                <RotateCcwKey
                  className={cn(generatePasswordLoading && "animate-spin")}
                />
                Generate Secure Password
              </Button>

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <PasswordInput
                        showPassword={showPassword}
                        onShowPassword={setShowPassword}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <PasswordInput
                        showPassword={showPassword}
                        onShowPassword={setShowPassword}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sendEmail"
                render={({ field: { onChange, value, ...field } }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        {...field}
                        checked={value}
                        onCheckedChange={onChange}
                      />
                    </FormControl>
                    <FormLabel className="font-normal">
                      Send email with new password to{" "}
                      <span className="font-bold underline">{user.email}</span>
                    </FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button
              type="submit"
              disabled={
                resetPasswordLoading || resetPasswordSuccess || !isValid
              }
            >
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
    <div className="relative">
      <Input
        type={showPassword ? "text" : "password"}
        className={cn("pr-10", className)}
        {...props}
        ref={ref}
      />
      <Button
        type="button"
        variant="ghost"
        className="absolute right-0 top-0"
        size="icon"
        onClick={() => onShowPassword(!showPassword)}
        tabIndex={-1}
      >
        {showPassword ? <EyeOff /> : <Eye />}
      </Button>
    </div>
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
