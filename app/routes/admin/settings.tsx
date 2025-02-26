import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Loader2, SendHorizonal } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { api } from "~/.server/api";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Separator } from "~/components/ui/separator";
import { useAuth } from "~/contexts/auth-context";
import { useAuthenticatedFetch } from "~/hooks/use-authenticated-fetch";
import { useModalSubmit } from "~/hooks/use-modal-submit";
import { globalSettingsSchema } from "~/lib/schema";
import type { Route } from "./+types/settings";

const resolver = zodResolver(globalSettingsSchema);
type TForm = z.infer<typeof globalSettingsSchema>;

export const loader = async ({ request }: Route.LoaderArgs) => {
  return api.settings.getGlobal(request);
};

export default function AdminSettings({
  loaderData: { data: settings },
}: Route.ComponentProps) {
  const { user } = useAuth();

  const form = useForm<TForm>({
    values: settings,
    resolver,
    mode: "onBlur",
  });

  const {
    formState: { isValid, isDirty },
    watch,
  } = form;

  const systemEmailFromAddress = watch("systemEmailFromAddress");

  const { createOrUpdateJson: submit, isSubmitting } = useModalSubmit();

  const handleSubmit = (data: TForm) => {
    submit(data, {
      path: "/api/proxy/settings/global",
      method: "patch",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Settings</CardTitle>
        <CardDescription>Configure global settings for Shield.</CardDescription>
        <Separator />
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="systemEmailFromAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>System Email From Address</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <Input {...field} />
                      <SendTestEmailButton to={user.email} from={field.value} />
                    </div>
                  </FormControl>
                  <FormDescription>
                    The from address for all emails sent from Shield. Can be an
                    email address or a friendly name in the following format:
                    <span className="px-1 py-0.5 bg-muted rounded-md ml-1">
                      Your Name &lt;sender@notify.fc-safety.com&gt;
                    </span>
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="productRequestToAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Request To Address</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <Input {...field} />
                      <SendTestEmailButton
                        to={field.value}
                        from={systemEmailFromAddress}
                        template="new-product-request"
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Product request emails will be sent to this address.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              disabled={!isValid || !isDirty || isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}

function SendTestEmailButton({
  to,
  from,
  template,
}: {
  to: string;
  from: string;
  template?: "test" | "new-product-request";
}) {
  const { fetch } = useAuthenticatedFetch();

  const { mutate: sendTestEmail, isPending: isSendingTestEmail } = useMutation({
    mutationFn: (to: string) => handleSendTestEmail(fetch, to, from, template),
    onSuccess: (_, to) => {
      toast.success(`Test email sent successfully to ${to}!`);
    },
  });

  return (
    <Button
      variant="outline"
      type="button"
      onClick={() => sendTestEmail(to)}
      disabled={isSendingTestEmail}
    >
      {isSendingTestEmail ? (
        <Loader2 className="animate-spin" />
      ) : (
        <SendHorizonal />
      )}
      Test
    </Button>
  );
}

const handleSendTestEmail = async (
  fetch: (url: string, options: RequestInit) => Promise<Response>,
  to: string,
  from: string,
  template: "test" | "new-product-request" = "test"
) =>
  fetch(`/notifications/send-test-email?template=${template}`, {
    method: "POST",
    body: JSON.stringify({ to, from }),
    headers: {
      "Content-Type": "application/json",
    },
  }).then((res) => {
    if (!res.ok) {
      throw res;
    }

    return res.json();
  });
