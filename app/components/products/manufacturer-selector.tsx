import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link2, Loader2, Pencil, Plus, Search, SearchX, Settings, Trash } from "lucide-react";
import { useMemo, useState } from "react";
import { useAccessIntent } from "~/contexts/requested-access-context";
import { useAuthenticatedFetch } from "~/hooks/use-authenticated-fetch";
import { useBlurOnClose } from "~/hooks/use-blur-on-close";
import useConfirmAction from "~/hooks/use-confirm-action";
import type { Manufacturer } from "~/lib/models";
import {
  MANUFACTURERS_QUERY_KEY_PREFIX,
  getManufacturersForSelectorQueryOptions,
} from "~/lib/services/manufacturers.service";
import { cn } from "~/lib/utils";
import ConfirmationDialog from "../confirmation-dialog";
import LinkPreview from "../link-preview";
import {
  ResponsiveModal,
  ResponsiveModalBody,
  ResponsiveModalContent,
  ResponsiveModalFooter,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalTrigger,
} from "../responsive-modal";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "../ui/empty";
import CustomTag from "./custom-tag";
import EditManufacturerButton from "./edit-manufacturer-button";

interface ManufacturerSelectorProps {
  value?: string;
  onValueChange?: (value: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  className?: string;
  clientId?: string;
}

export default function ManufacturerSelector({
  value,
  onValueChange,
  onBlur,
  disabled,
  className,
  clientId,
}: ManufacturerSelectorProps) {
  const accessIntent = useAccessIntent();
  const { fetchOrThrow } = useAuthenticatedFetch();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [tempValue, setTempValue] = useState(value);
  const [managing, setManaging] = useState(false);
  const [editManufacturer, setEditManufacturer] = useState<Manufacturer | null>(null);

  const queryOptions = getManufacturersForSelectorQueryOptions(fetchOrThrow, {
    clientId,
    accessIntent,
  });

  const { data: manufacturers = [], isLoading } = useQuery({
    ...queryOptions,
    enabled: open || !!value,
  });

  const invalidateManufacturers = () => {
    queryClient.invalidateQueries({
      predicate: ({ queryKey }) => queryKey[0] === MANUFACTURERS_QUERY_KEY_PREFIX,
    });
  };

  const deleteMutation = useMutation({
    mutationFn: (manufacturerId: string) =>
      fetchOrThrow(`/manufacturers/${manufacturerId}`, { method: "DELETE" }),
    onSuccess: invalidateManufacturers,
  });

  const [deleteAction, setDeleteAction] = useConfirmAction({
    variant: "destructive",
  });

  const defaultManufacturer = useMemo(
    () => manufacturers.find((c) => c.id === value),
    [manufacturers, value]
  );

  useBlurOnClose({
    onBlur,
    open,
  });

  const canManage = (manufacturer: Manufacturer) => {
    if (accessIntent === "system") return true;
    return !!manufacturer.clientId && manufacturer.clientId === clientId;
  };

  const hasManageableItems = useMemo(
    () => manufacturers.some(canManage),
    [manufacturers, accessIntent, clientId]
  );

  return (
    <ResponsiveModal open={open} onOpenChange={setOpen}>
      {value ? (
        <ManufacturerCard
          manufacturer={defaultManufacturer}
          renderEditButton={() => (
            <ResponsiveModalTrigger>
              <Button type="button" variant="ghost" size="icon" disabled={disabled}>
                <Pencil />
              </Button>
            </ResponsiveModalTrigger>
          )}
        />
      ) : (
        <ResponsiveModalTrigger>
          <Button type="button" size="sm" disabled={disabled} className={cn(className)}>
            <Search />
            Select Manufacturer
          </Button>
        </ResponsiveModalTrigger>
      )}
      <ResponsiveModalContent classNames={{ dialog: "sm:max-w-2xl" }}>
        <ResponsiveModalHeader>
          <ResponsiveModalTitle>Find Manufacturer</ResponsiveModalTitle>
        </ResponsiveModalHeader>
        <ResponsiveModalBody>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="animate-spin" />
            </div>
          ) : manufacturers.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <SearchX />
                </EmptyMedia>
                <EmptyTitle>No manufacturers found.</EmptyTitle>
                <EmptyDescription>
                  There are no manufacturers available for you to select for this product.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : null}
          <RadioGroup
            defaultValue="card"
            className="grid grid-cols-2 gap-4 py-2"
            onValueChange={managing ? undefined : setTempValue}
            value={tempValue ?? ""}
          >
            <EditManufacturerButton
              onSubmitted={invalidateManufacturers}
              trigger={
                <Button
                  type="button"
                  variant="outline"
                  className="bg-primary/5 border-primary text-primary hover:bg-primary/10 hover:text-primary flex h-full min-h-[88px] w-full flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed p-4"
                >
                  <Plus className="size-5" />
                  <span className="text-xs">New Manufacturer</span>
                </Button>
              }
            />
            {manufacturers
              .filter((m) => m.active || m.id === value)
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((manufacturer) => (
                <div key={manufacturer.id} className="relative">
                  <RadioGroupItem
                    value={manufacturer.id}
                    id={manufacturer.id}
                    className="peer sr-only"
                    disabled={!manufacturer.active || managing}
                  />
                  <Label
                    htmlFor={manufacturer.id}
                    className={cn(
                      "border-muted bg-popover hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary flex h-full flex-col items-center justify-center gap-2 rounded-md border-2 p-4 font-semibold",
                      managing && "pointer-events-none"
                    )}
                  >
                    {manufacturer.clientId && <CustomTag />}
                    {manufacturer.name}
                  </Label>
                  {managing && canManage(manufacturer) && (
                    <div className="absolute inset-0 flex items-center justify-center gap-2 rounded-md bg-black/50">
                      <Button
                        type="button"
                        size="icon"
                        variant="secondary"
                        onClick={() => setEditManufacturer(manufacturer)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="destructive"
                        onClick={() => {
                          setDeleteAction((draft) => {
                            draft.open = true;
                            draft.title = "Delete Manufacturer";
                            draft.message = `Are you sure you want to delete ${manufacturer.name}?`;
                            draft.requiredUserInput = manufacturer.name;
                            draft.onConfirm = () => {
                              deleteMutation.mutate(manufacturer.id);
                            };
                          });
                        }}
                      >
                        <Trash className="size-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
          </RadioGroup>
        </ResponsiveModalBody>
        <ResponsiveModalFooter className="flex w-full items-center justify-between gap-2">
          <Button
            type="button"
            variant={managing ? "default" : "outline"}
            onClick={() => setManaging((m) => !m)}
            disabled={!hasManageableItems && !managing}
            title={!hasManageableItems ? "No custom manufacturers to manage" : undefined}
          >
            <Settings className="size-4" />
            {managing ? "Done" : "Manage"}
          </Button>
          <div className="flex gap-2">
            <Button variant="secondary" type="button" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (tempValue) {
                  onValueChange?.(tempValue);
                }
                setOpen(false);
              }}
              disabled={!tempValue || managing}
            >
              Select
            </Button>
          </div>
        </ResponsiveModalFooter>
      </ResponsiveModalContent>
      <EditManufacturerButton
        manufacturer={editManufacturer ?? undefined}
        open={!!editManufacturer}
        onOpenChange={(open) => {
          if (!open) setEditManufacturer(null);
        }}
        onSubmitted={invalidateManufacturers}
        trigger={null}
      />
      <ConfirmationDialog {...deleteAction} />
    </ResponsiveModal>
  );
}

interface ManufacturerCardProps {
  manufacturer: Manufacturer | undefined;
  renderEditButton?: () => React.ReactNode;
  className?: string;
}

export function ManufacturerCard({
  manufacturer,
  renderEditButton,
  className,
}: ManufacturerCardProps) {
  return (
    <Card className={className}>
      {manufacturer ? (
        <>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {manufacturer?.name}
              {manufacturer.homeUrl && (
                <LinkPreview url={manufacturer.homeUrl}>
                  <Button size="icon" variant="ghost" type="button">
                    <Link2 />
                  </Button>
                </LinkPreview>
              )}
              {manufacturer.clientId && <CustomTag />}
              <div className="flex-1"></div>
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
