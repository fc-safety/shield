import { Asterisk, Info } from "lucide-react";

export function RequiredFieldIndicator() {
  return (
    // <div className="bg-primary/10 border-primary/20 dark:bg-primary/10 text-primary ml-1 inline-flex items-center justify-center rounded-md border p-0.5">
    <div className="inline-flex items-center justify-center">
      <Asterisk className="text-urgent size-3.5" />
    </div>
  );
}

export function RequiredFieldsNotice() {
  return (
    <div className="text-muted-foreground mb-4 flex w-fit items-center text-xs font-semibold">
      <Info className="size-3.5" />
      <RequiredFieldIndicator /> indicates a required field
    </div>
  );
}
