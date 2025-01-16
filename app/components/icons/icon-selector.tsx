import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Pencil, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useDebounceValue } from "usehooks-ts";
import { searchIcons } from "~/lib/fontawesome";
import { cn } from "~/lib/utils";
import { Input } from "../ui/input";

interface IconSelectorProps {
  value?: string;
  onValueChange?: (value: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  className?: string;
}

type TIcon = Awaited<ReturnType<typeof searchIcons>>[number];

export default function IconSelector({
  value,
  onValueChange,
  onBlur,
  disabled,
  className,
}: IconSelectorProps) {
  const opened = useRef(false);
  const [open, setOpen] = useState(false);
  const [tempValue, setTempValue] = useState(value);
  const [icons, setIcons] = useState<TIcon[]>([]);
  const [query, setQuery] = useDebounceValue("", 300);

  // Trigger onBlur when the dialog is closed.
  useEffect(() => {
    if (opened.current && !open) {
      onBlur?.();
    }

    if (open) {
      opened.current = true;
    }
  }, [open, onBlur]);

  useEffect(() => {
    searchIcons(query).then(setIcons);
  }, [query]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {value ? (
        <IconCard
          icon={{ id: value, label: value }}
          renderEditButton={() => (
            <DialogTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={disabled}
              >
                <Pencil />
              </Button>
            </DialogTrigger>
          )}
        />
      ) : (
        <DialogTrigger asChild>
          <Button
            type="button"
            size="sm"
            disabled={disabled}
            className={cn(className)}
          >
            <Search />
            Select Icon
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="px-0">
        <DialogHeader className="px-6">
          <DialogTitle>Find an icon</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-96 border-b border-t px-6 self-stretch">
          <div className="relative overflow-visible my-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4" />
            <Input
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search..."
              className="pl-10"
            />
          </div>
          <RadioGroup
            defaultValue="card"
            className="grid grid-cols-2 gap-4 py-2"
            onValueChange={setTempValue}
            value={tempValue ?? ""}
          >
            {icons.map((icon) => (
              <div key={icon.id}>
                <RadioGroupItem
                  value={icon.id}
                  id={"fa-icon-" + icon.id}
                  className="peer sr-only"
                />
                <Label
                  htmlFor={"fa-icon-" + icon.id}
                  className="font-semibold h-full flex flex-col gap-2 items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  {icon.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </ScrollArea>
        <div className="flex justify-end gap-2 px-6">
          <DialogClose asChild>
            <Button variant="secondary">Cancel</Button>
          </DialogClose>
          <Button
            onClick={() => {
              if (tempValue) {
                onValueChange?.(tempValue);
              }
              setOpen(false);
            }}
            disabled={tempValue === undefined}
          >
            Select
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface IconCardProps {
  icon: TIcon | undefined;
  renderEditButton?: () => React.ReactNode;
}

export function IconCard({ icon, renderEditButton }: IconCardProps) {
  return (
    <Card>
      {icon ? (
        <>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="grid gap-2">
                  <span className="text-xs text-muted-foreground">ID</span>
                  {icon.id}
                </div>
              </div>
              {renderEditButton?.()}
            </CardTitle>
          </CardHeader>
        </>
      ) : (
        <CardHeader>
          <CardTitle>
            <Loader2 className="animate-spin" />
          </CardTitle>
        </CardHeader>
      )}
    </Card>
  );
}
