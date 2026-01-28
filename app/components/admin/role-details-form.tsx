import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Form as FormProvider,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle } from "lucide-react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { useModalFetcher } from "~/hooks/use-modal-fetcher";
import { createRoleSchema, updateRoleSchema } from "~/lib/schema";
import { serializeFormJson } from "~/lib/serializers";
import type { Role } from "~/lib/types";
import { Alert, AlertDescription } from "../ui/alert";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Switch } from "../ui/switch";
import { Textarea } from "../ui/textarea";

const ROLE_SCOPES = [
  { value: "SYSTEM", label: "System", description: "Full system access for internal operations" },
  {
    value: "GLOBAL",
    label: "Global (All Clients)",
    description: "Access to all clients and all data",
  },
  {
    value: "CLIENT",
    label: "Client (All Sites)",
    description: "Access to all sites within the assigned client",
  },
  { value: "SITE_GROUP", label: "Site Group", description: "Access to a specific group of sites" },
  { value: "SITE", label: "Single Site", description: "Access limited to a single site" },
  { value: "SELF", label: "Self Only", description: "Access limited to own records only" },
] as const;

type TForm = z.infer<typeof createRoleSchema | typeof updateRoleSchema>;
interface RoleDetailsFormProps {
  role?: Role;
  onSubmitted?: () => void;
}

const FORM_DEFAULTS = {
  name: "",
  description: "",
  scope: "SITE",
  clientAssignable: false,
} satisfies TForm;

export default function RoleDetailsForm({ role, onSubmitted }: RoleDetailsFormProps) {
  const isNew = !role;

  const form = useForm<TForm>({
    resolver: zodResolver(isNew ? createRoleSchema : updateRoleSchema),
    defaultValues: role ?? FORM_DEFAULTS,
    mode: "onBlur",
  });

  const {
    formState: { isDirty, isValid },
    watch,
  } = form;

  const scope = watch("scope");
  const clientAssignable = watch("clientAssignable");
  const showScopeWarning = clientAssignable && (scope === "GLOBAL" || scope === "SYSTEM");

  const { createOrUpdateJson: submit, isSubmitting } = useModalFetcher({
    onSubmitted,
  });

  const handleSubmit = (data: TForm) => {
    // When updating, preserve capabilities and notificationGroups that aren't part of this form
    const payload = isNew
      ? data
      : {
          ...data,
          capabilities: role.capabilities,
          notificationGroups: role.notificationGroups,
        };
    submit(serializeFormJson(payload), {
      path: `/api/proxy/roles`,
      id: role?.id,
    });
  };

  return (
    <FormProvider {...form}>
      <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="scope"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Scope</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a scope" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {ROLE_SCOPES.map((scope) => (
                    <SelectItem key={scope.value} value={scope.value}>
                      {scope.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                {ROLE_SCOPES.find((s) => s.value === field.value)?.description}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="clientAssignable"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Assignable by clients</FormLabel>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} className="block" />
              </FormControl>
              <FormDescription>
                If enabled, client admins can assign this role to their own users.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        {showScopeWarning && (
          <Alert variant="destructive">
            <AlertTriangle className="size-4" />
            <AlertDescription>
              Warning: Granting {scope} scope to a client-assignable role may give client admins the
              ability to elevate user privileges beyond their organization.
            </AlertDescription>
          </Alert>
        )}
        <Button type="submit" disabled={isSubmitting || (!isNew && !isDirty) || !isValid}>
          {isSubmitting ? "Saving..." : "Save"}
        </Button>
      </form>
    </FormProvider>
  );
}
