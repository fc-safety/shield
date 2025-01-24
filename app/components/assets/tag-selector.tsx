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
import { Loader2, Nfc, Pencil, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useFetcher } from "react-router";
import { useBlurOnClose } from "~/hooks/use-blur-on-close";
import type { ResultsPage, Tag } from "~/lib/models";
import { cn } from "~/lib/utils";
import { CopyableText } from "../copyable-text";

interface TagSelectorProps {
  value?: string;
  onValueChange?: (value: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  className?: string;
}

export default function TagSelector({
  value,
  onValueChange,
  onBlur,
  disabled,
  className,
}: TagSelectorProps) {
  const [open, setOpen] = useState(false);
  const [tempValue, setTempValue] = useState(value);
  const fetcher = useFetcher<ResultsPage<Tag>>();

  useBlurOnClose({
    onBlur,
    open,
  });

  const [tags, setTags] = useState<Tag[]>([]);

  const defaultTag = useMemo(
    () => tags.find((c) => c.id === value),
    [tags, value]
  );

  // Preload all tags lazily.
  const handlePreload = useCallback(() => {
    if (fetcher.state === "idle" && fetcher.data === undefined) {
      fetcher.load("/api/tags");
    }
  }, [fetcher]);

  // Set the tags when they are loaded from the fetcher.
  useEffect(() => {
    if (fetcher.data) {
      setTags(fetcher.data.results);
    }
  }, [fetcher.data]);

  // Preload the tags when a value is set.
  useEffect(() => {
    if (value) {
      handlePreload();
    }
  }, [value, handlePreload]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {value ? (
        <TagCard
          tag={defaultTag}
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
            onMouseEnter={handlePreload}
          >
            <Search />
            Select Tag
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="px-0">
        <DialogHeader className="px-6">
          <DialogTitle>Find Tag by Serial No.</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-96 border-b border-t px-6 self-stretch">
          {tags.length === 0 && (
            <div className="text-sm flex flex-col items-center p-4 mt-2">
              No tags found.
            </div>
          )}
          <RadioGroup
            defaultValue="card"
            className="grid grid-cols-2 gap-4 py-2"
            onValueChange={setTempValue}
            value={tempValue ?? ""}
          >
            {tags
              .sort((a, b) =>
                !a.asset !== !b.asset
                  ? !a.asset
                    ? -1
                    : 1
                  : a.serialNumber.localeCompare(b.serialNumber)
              )
              .map((tag) => (
                <div key={tag.id}>
                  <RadioGroupItem
                    value={tag.id}
                    id={tag.id}
                    className="peer sr-only"
                    disabled={!!tag.asset && tag.id !== value}
                  />
                  <Label
                    htmlFor={tag.id}
                    className="font-semibold h-full flex flex-col gap-2 items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    <span className="text-xs text-center">
                      {tag.serialNumber}
                    </span>
                    {tag.asset && (
                      <span className="font-light text-xs text-center">
                        assigned to {tag.asset.name}
                      </span>
                    )}
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

interface TagCardProps {
  tag: Tag | undefined;
  renderEditButton?: () => React.ReactNode;
}

export function TagCard({ tag, renderEditButton }: TagCardProps) {
  return (
    <Card>
      {tag ? (
        <>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Nfc className="size-6 text-primary" />
                <div className="grid gap-0">
                  <span className="text-xs text-muted-foreground">
                    Serial Number
                  </span>
                  <CopyableText text={tag?.serialNumber ?? ""} />
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
