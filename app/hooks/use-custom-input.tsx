import { useCallback, useEffect, useRef, useState } from "react";
import { objectsEqual } from "~/lib/utils";

export function useCustomInput<T>({
  defaultValue,
  value: valueProp,
  onValueChange,
  onPendingValueChange,
}: {
  defaultValue?: T;
  value?: T;
  onValueChange?: (value: T | undefined) => void;
  onPendingValueChange?: (value: T | undefined) => void;
}) {
  const [pendingValue, setPendingValue] = useState<T | undefined>(
    valueProp ?? defaultValue
  );
  const [internalValue, setInternalValue] = useState<T | undefined>(
    pendingValue
  );

  const changesPending = useRef(false);

  useEffect(() => {
    if (valueProp !== undefined) {
      if (!objectsEqual(valueProp, internalValue)) {
        setInternalValue(valueProp);

        if (!changesPending.current) {
          setPendingValue(valueProp);
        }
      }
    }
  }, [valueProp, internalValue]);

  const handleSetPendingValue = useCallback(
    (value: T | undefined) => {
      changesPending.current = true;
      setPendingValue(value);
      onPendingValueChange?.(value);
    },
    [onPendingValueChange]
  );

  const applyValue = useCallback(() => {
    changesPending.current = false;
    setInternalValue(pendingValue);
    onValueChange?.(pendingValue);
  }, [onValueChange, pendingValue]);

  return {
    value: pendingValue,
    setValue: handleSetPendingValue,
    appliedValue: internalValue,
    applyValue,
  };
}
