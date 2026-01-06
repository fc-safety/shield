import { useState } from "react";
import { useViewContext } from "~/contexts/view-context";
import { useModalFetcher } from "~/hooks/use-modal-fetcher";
import { Checkbox } from "./ui/checkbox";

interface SubmittingCheckboxProps {
  checked: boolean;
  onCheckedChange?: (checked: boolean) => void;
  path: string;
  checkedKey: string | ((checked: boolean) => any);
  className?: string;
}

export default function SubmittingCheckbox({
  checked,
  onCheckedChange,
  path,
  checkedKey,
  className,
}: SubmittingCheckboxProps) {
  const viewContext = useViewContext();
  const [isChecked, setIsChecked] = useState(() => checked);
  const { submitJson: toggle, isLoading } = useModalFetcher();

  return (
    <Checkbox
      checked={isChecked}
      onCheckedChange={(checkedState) => {
        const checked = checkedState === true;
        setIsChecked(checked);
        onCheckedChange?.(checked);
        toggle(typeof checkedKey === "function" ? checkedKey(checked) : { [checkedKey]: checked }, {
          method: "patch",
          path,
          viewContext,
        });
      }}
      disabled={isLoading}
      className={className}
    />
  );
}
