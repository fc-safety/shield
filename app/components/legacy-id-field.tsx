import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { UseFormReturn } from "react-hook-form";
import { useAuth } from "~/contexts/auth-context";
import { isSuperAdmin } from "~/lib/users";

interface LegacyIdFieldProps {
  form: UseFormReturn<any>;
  fieldName: string;
  label: string;
  description: string;
  readOnly?: boolean;
}

export default function LegacyIdField({
  form,
  fieldName,
  label,
  description,
  readOnly = false,
}: LegacyIdFieldProps) {
  const { user } = useAuth();
  const userIsSuperAdmin = isSuperAdmin(user);

  if (!userIsSuperAdmin) {
    return null;
  }

  return (
    <FormField
      control={form.control}
      name={fieldName}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-muted-foreground">{label}</FormLabel>
          <FormControl>
            <Input {...field} readOnly={readOnly} />
          </FormControl>
          <FormDescription>{description}</FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
