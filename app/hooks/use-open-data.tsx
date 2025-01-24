import { useState } from "react";

export function useOpenData<T>() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<T | null>(null);

  const openData = (data: T) => {
    setOpen(true);
    setData(data);
  };

  return {
    open,
    setOpen,
    data,
    setData,
    openData,
  };
}
