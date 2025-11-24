import { AnimatePresence, motion } from "framer-motion";
import Fuse from "fuse.js";
import { AlertTriangle, ArrowRight, Check, CheckCircle, CircleX } from "lucide-react";
import { useMemo, useState, type ComponentProps } from "react";
import { ResponsiveCombobox } from "~/components/responsive-combobox";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { beautifyPhone, cn, stripPhone } from "~/lib/utils";
import type { WsChatBlock } from "../types/ws-chat";

export default function ChatBlock({
  chatBlock,
  onEmitValue,
}: {
  chatBlock: WsChatBlock;
  onEmitValue: (value: any) => void;
}) {
  if (chatBlock.type === "system_note") {
    return (
      <div className="text-muted-foreground self-center text-sm font-semibold">
        {chatBlock.message}
      </div>
    );
  }
  return (
    <div
      className={cn(
        "flex max-w-[80%] flex-col gap-y-2 rounded-lg border p-3 text-sm",
        chatBlock.direction === "incoming"
          ? "bg-secondary text-secondary-foreground self-start"
          : "bg-primary text-primary-foreground self-end"
      )}
    >
      {chatBlock.type === "prompt" && chatBlock.direction === "outgoing" ? (
        <PromptChatBlock chatBlock={chatBlock} onEmitValue={onEmitValue} />
      ) : (
        <div className="flex items-center gap-2">
          {chatBlock.alertType === "success" && (
            <CheckCircle className="animate-pop-once text-primary fill-primary/20 size-5" />
          )}
          {chatBlock.alertType === "warning" && (
            <AlertTriangle className="text-warning-foreground fill-warning dark:text-warning dark:fill-warning/20 size-5 shrink-0" />
          )}
          {chatBlock.alertType === "error" && (
            <CircleX className="text-destructive fill-destructive/20 size-5 shrink-0" />
          )}
          {chatBlock.message}
        </div>
      )}
    </div>
  );
}

const PromptChatBlock = ({
  chatBlock,
  onEmitValue,
}: {
  chatBlock: WsChatBlock;
  onEmitValue: (value: any) => void;
}) => {
  const [value, setValue] = useState<any>(
    chatBlock.promptValue ??
      (chatBlock.promptType === "address"
        ? {
            street1: "",
            street2: "",
            city: "",
            state: "",
            zip: "",
          }
        : "")
  );
  const isInactive = chatBlock.status !== "active";

  const handleChangeObject = (e: React.ChangeEvent<HTMLInputElement>, filter?: (v: any) => any) => {
    setValue((v: any) => ({
      ...(v && typeof v === "object" ? v : {}),
      [e.target.name]: filter ? filter(e.target.value) : e.target.value,
    }));
  };

  return (
    <div>
      {chatBlock.promptType === "select" ? (
        <div className="flex flex-col gap-y-2">
          <ResponsiveSelect
            options={chatBlock.promptOptions ?? []}
            value={value}
            onValueChange={setValue}
            disabled={isInactive}
            placeholder="Select an option"
            className="w-64 bg-transparent text-xs"
          />
          <ContinueButton
            onClick={() => onEmitValue(value)}
            disabled={value === ""}
            hidden={isInactive}
          />
        </div>
      ) : chatBlock.promptType === "confirm" ? (
        <div className="flex flex-row gap-x-2">
          <Button
            onClick={() => onEmitValue(true)}
            variant="ghost"
            size="sm"
            className="group"
            disabled={isInactive}
          >
            Yes <Check className="group-hover:text-primary" />
          </Button>
          <Button
            onClick={() => onEmitValue(false)}
            variant="ghost"
            size="sm"
            className="group"
            disabled={isInactive}
          >
            No <CircleX className="group-hover:text-destructive" />
          </Button>
        </div>
      ) : chatBlock.promptType === "address" ? (
        <form
          className="flex w-72 flex-col gap-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            onEmitValue(value);
          }}
        >
          <div className="grid grid-cols-12 gap-1">
            <LabelledInput
              label="Address Line 1"
              value={value.street1}
              name="street1"
              onChange={handleChangeObject}
              disabled={isInactive}
              className="col-span-full"
              required
            />
            <LabelledInput
              label="Address Line 2"
              value={value.street2}
              name="street2"
              onChange={handleChangeObject}
              disabled={isInactive}
              className="col-span-full"
            />
            <LabelledInput
              label="City"
              value={value.city}
              name="city"
              onChange={handleChangeObject}
              disabled={isInactive}
              className="col-span-full"
              required
            />
            <LabelledInput
              label="State"
              value={value.state}
              name="state"
              onChange={(e) =>
                handleChangeObject(e, (v) =>
                  v
                    .toUpperCase()
                    .replace(/[^A-Z]/g, "")
                    .slice(0, 2)
                )
              }
              disabled={isInactive}
              className="col-span-4"
              required
            />
            <LabelledInput
              label="Zip Code"
              value={value.zip}
              name="zip"
              onChange={(e) => handleChangeObject(e, (v) => v.replace(/[^\d]/g, "").slice(0, 5))}
              disabled={isInactive}
              className="col-span-8"
              required
            />
          </div>
          <ContinueButton type="submit" hidden={isInactive} />
        </form>
      ) : chatBlock.promptType === "phone" ? (
        <form
          className="flex flex-col gap-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            onEmitValue(value);
          }}
        >
          <LabelledInput
            label="Phone Number"
            value={beautifyPhone(value)}
            onChange={(e) => setValue(stripPhone(beautifyPhone(e.target.value)))}
            disabled={isInactive}
            type={"tel"}
          />
          <ContinueButton type="submit" hidden={isInactive} disabled={value === ""} />
        </form>
      ) : (
        <div className="flex flex-col gap-y-2">
          <Input value={value} onChange={(e) => setValue(e.target.value)} disabled={isInactive} />
          <ContinueButton
            onClick={() => onEmitValue(value)}
            disabled={value === ""}
            hidden={isInactive}
          />
        </div>
      )}
    </div>
  );
};

const ContinueButton = ({
  className,
  hidden,
  ...props
}: ComponentProps<"button"> & { hidden?: boolean }) => {
  return (
    <AnimatePresence>
      {!hidden && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
        >
          <Button variant="ghost" size="sm" className={cn("group w-full", className)} {...props}>
            Continue <ArrowRight className="group-hover:text-primary" />
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const fuse = new Fuse([] as { label: string; value: string }[], {
  keys: ["label"],
});
const ResponsiveSelect = ({
  options: allOptions,
  ...props
}: Omit<
  ComponentProps<typeof ResponsiveCombobox>,
  "options" | "searchValue" | "onSearchValueChange"
> & {
  options: { label: string; value: string }[];
}) => {
  const [search, setSearch] = useState("");

  const options = useMemo(() => {
    let filteredOptions = allOptions;
    if (search) {
      fuse.setCollection(allOptions);
      filteredOptions = fuse.search(search).map((result) => result.item);
    }
    return filteredOptions.map((option) => ({
      label: option.label,
      value: String(option.value),
    }));
  }, [allOptions, search]);

  return (
    <ResponsiveCombobox
      options={options}
      {...props}
      searchValue={search}
      onSearchValueChange={setSearch}
      shouldFilter={false}
      displayValue={(value) => options.find((option) => option.value === value)?.label ?? value}
    />
  );
};

const LabelledInput = ({
  label,
  className,
  ...props
}: ComponentProps<"input"> & { label: string }) => {
  return (
    <div className={cn(className)}>
      <Label className="text-xs">{label}</Label>
      <Input
        {...props}
        onFocus={(e) => e.target.select()}
        className="bg-background/60 text-foreground"
      />
    </div>
  );
};
