import { useEffect } from "react";

export default function useRefreshByNumericKey(refreshKey: number, refresh: () => void) {
  useEffect(() => {
    if (refreshKey === 0) return;
    refresh();
  }, [refreshKey]);
}
