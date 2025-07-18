import { useState } from "react";
import { useModalFetcher } from "~/hooks/use-modal-fetcher";
import { Switch } from "./ui/switch";

interface ActiveToggleProps {
  active: boolean;
  onActiveChange?: (active: boolean) => void;
  path: string;
  isActiveKey?: string;
  className?: string;
}

export default function ActiveToggle({
  active,
  onActiveChange,
  path,
  isActiveKey = "active",
  className,
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
          }
        );
      }}
      disabled={isLoading}
    />
  );
}
