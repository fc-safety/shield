import { Check, ChevronDown } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useRemixForm } from "remix-hook-form";
import { Button } from "~/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/components/ui/command";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { demoUsers } from "~/lib/demo-data";
import { cn } from "~/lib/utils";

type User = (typeof demoUsers)[number];

export function SendNotificationsForm() {
  const [open, setOpen] = useState(false);
  const users = demoUsers;
  const notificationsForm = useRemixForm({
    defaultValues: {
      recipients: [] as User[],
    },
  });
  const { watch, setValue } = notificationsForm;

  const recipients = watch("recipients");

  const [selectionQueue, setSelectionQueue] = useState<User[]>([]);
  const [deselectionQueue, setDeselectionQueue] = useState<User[]>([]);

  const flushSelectedQueue = useCallback(() => {
    if (selectionQueue.length > 0) {
      setValue("recipients", [...recipients, ...selectionQueue]);
      setSelectionQueue([]);
    }
    if (deselectionQueue.length > 0) {
      setValue(
        "recipients",
        recipients.filter((r) => !deselectionQueue.find((u) => u.id === r.id))
      );
      setDeselectionQueue([]);
    }
  }, [recipients, selectionQueue, deselectionQueue, setValue]);

  useEffect(() => {
    if (!open) {
      flushSelectedQueue();
    }
  }, [open, flushSelectedQueue]);

  return (
    <Form {...notificationsForm}>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
        }}
      >
        <FormField
          control={notificationsForm.control}
          name="recipients"
          render={({ field: { value } }) => (
            <FormItem>
              <FormLabel>
                Recipients {value.length > 0 && <span>({value.length})</span>}
              </FormLabel>
              <FormControl>
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={open}
                      className="w-full justify-between"
                    >
                      <span className="overflow-hidden whitespace-nowrap overflow-ellipsis">
                        {value.length > 0
                          ? value.map((v) => v.name).join(", ")
                          : "Select recipients..."}
                      </span>
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="min-w-[300px] p-0">
                    <Command>
                      <CommandInput placeholder="Search recipients..." />
                      <CommandList>
                        <CommandEmpty>No results found.</CommandEmpty>
                        <CommandGroup>
                          {value.map((v) => {
                            const inQueue =
                              deselectionQueue.findIndex((q) => q.id === v.id) >
                              -1;
                            return (
                              <CommandItem
                                key={v.id}
                                onSelect={() => {
                                  if (inQueue) {
                                    setDeselectionQueue((prev) =>
                                      prev.filter((q) => q.id !== v.id)
                                    );
                                  } else {
                                    setDeselectionQueue((prev) => [...prev, v]);
                                  }
                                }}
                              >
                                <SelectCheckbox selected={!inQueue} />
                                {v.name} &lt;{v.email}&gt;
                              </CommandItem>
                            );
                          })}
                          {[
                            ...users.filter(
                              (user) =>
                                !value.some((u) => user.id === u.id) ||
                                selectionQueue.some((q) => user.id === q.id)
                            ),
                          ].map((user) => {
                            const inQueue =
                              selectionQueue.findIndex(
                                (q) => q.id === user.id
                              ) > -1;
                            return (
                              <CommandItem
                                key={user.id}
                                onSelect={() => {
                                  setSelectionQueue((prev) => {
                                    if (inQueue) {
                                      return prev.filter(
                                        (q) => q.id !== user.id
                                      );
                                    } else {
                                      return [...prev, user];
                                    }
                                  });
                                }}
                              >
                                <SelectCheckbox selected={inQueue} />
                                {user.name} &lt;{user.email}&gt;
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex gap-2">
          <Button
            type="submit"
            variant={recipients.length > 0 ? "default" : "secondary"}
            disabled={recipients.length === 0}
          >
            Send
          </Button>
          {recipients.length > 0 && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => setValue("recipients", [])}
            >
              Clear
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}

const SelectCheckbox = ({ selected }: { selected: boolean }) => {
  return (
    <div
      className={cn(
        "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
        selected
          ? "bg-primary text-primary-foreground"
          : "opacity-50 [&_svg]:invisible"
      )}
    >
      <Check />
    </div>
  );
};
