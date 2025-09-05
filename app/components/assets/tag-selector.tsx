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
import type { Asset, ResultsPage, Tag } from "~/lib/models";
import { cn } from "~/lib/utils";
import EditableTagDisplay from "./editable-tag-display";

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

  const defaultTag = useMemo(() => tags.find((c) => c.id === value), [tags, value]);

  // Preload all tags lazily.
  const handlePreload = useCallback(() => {
    if (fetcher.state === "idle" && fetcher.data === undefined) {
      fetcher.load("/api/proxy/tags?limit=10000");
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
          tagLoading={!defaultTag}
          renderEditButton={() => (
            <DialogTrigger asChild>
              <Button type="button" variant="ghost" size="icon" disabled={disabled}>
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
            onTouchStart={handlePreload}
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
        <ScrollArea
          classNames={{
            root: "h-96 border-b border-t px-6 self-stretch",
          }}
        >
          {tags.length === 0 && (
            <div className="mt-2 flex flex-col items-center p-4 text-sm">No tags found.</div>
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
                    className="border-muted bg-popover hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary flex h-full flex-col items-center justify-center gap-2 rounded-md border-2 p-4 font-semibold"
                  >
                    <span className="text-center text-xs">{tag.serialNumber}</span>
                    {tag.asset && (
                      <span className="text-center text-xs font-light">
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
  asset?: Asset;
  tagLoading?: boolean;
  renderEditButton?: () => React.ReactNode;
}

export function TagCard({ tag, asset, tagLoading, renderEditButton }: TagCardProps) {
  return (
    <Card>
      {tagLoading ? (
        <CardHeader>
          <CardTitle>
            <Loader2 className="animate-spin" />
          </CardTitle>
        </CardHeader>
      ) : (
        <>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Nfc className="text-primary size-6!" />
                <div className="grid gap-0">
                  {tag && <span className="text-muted-foreground text-xs">Serial Number</span>}
                  <EditableTagDisplay tag={tag} asset={asset ?? tag?.asset ?? undefined} />
                </div>
              </div>
              {renderEditButton?.()}
            </CardTitle>
          </CardHeader>
        </>
      )}
    </Card>
  );
}
