import { useFormContext } from "react-hook-form";
import { cn } from "~/lib/utils";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "./ui/form";
import { Switch } from "./ui/switch";

type TForm = { active: boolean };

export default function ActiveToggleFormInput() {
  const form = useFormContext<TForm>();
  return (
    <FormField
      control={form.control}
      name="active"
      render={({ field: { onChange, onBlur, value } }) => (
        <FormItem>
          <div className="flex flex-row items-center gap-2 space-y-0">
            <FormControl>
              <Switch checked={value} onCheckedChange={onChange} className="pt-0" onBlur={onBlur} />
            </FormControl>
            <FormLabel className={cn(!value && "text-muted-foreground")}>
              {value ? "Active" : "Inactive"}
            </FormLabel>
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
