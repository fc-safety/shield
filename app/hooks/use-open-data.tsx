import { useCallback, useState } from "react";

export function useOpenData<T>() {
  const [open, setOpen] = useState(() => false);
  const [data, setData] = useState<T | null>(() => null);

  const openData = useCallback((data: T) => {
    setOpen(true);
    setData(data);
  }, []);

  const openNew = useCallback(() => {
    setOpen(true);
    setData(null);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    setData(null);
  }, []);

  return {
    open,
    setOpen,
    data,
    setData,
    openData,
    openNew,
    close,
  };
}
