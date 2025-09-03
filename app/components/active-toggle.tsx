import { useState } from "react";
import type { ViewContext } from "~/.server/api-utils";
import { useModalFetcher } from "~/hooks/use-modal-fetcher";
import { Switch } from "./ui/switch";

interface ActiveToggleProps {
  active: boolean;
  onActiveChange?: (active: boolean) => void;
  path: string;
  isActiveKey?: string;
  className?: string;
  viewContext?: ViewContext;
}

export default function ActiveToggle({
  active,
  onActiveChange,
  path,
  isActiveKey = "active",
  className,
  viewContext,
}: ActiveToggleProps) {
  const [internalActive, setInternalActive] = useState(() => active);

  const { submitJson: toggleActive, isLoading } = useModalFetcher();

  return (
    <Switch
      className={className}
      checked={internalActive}
      onCheckedChange={(checked) => {
        setInternalActive(checked);
        onActiveChange?.(checked);
        toggleActive(
          { [isActiveKey]: checked },
          {
            method: "patch",
            path,
            viewContext,
          }
        );
      }}
      disabled={isLoading}
    />
  );
}
