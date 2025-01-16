import { useMemo } from "react";
import { isRouteErrorResponse } from "react-router";

export default function useBoundaryError({ error }: { error: unknown }) {
  const errorDisplay = useMemo(() => {
    if (isRouteErrorResponse(error)) {
      return {
        title: error.status,
        subtitle: error.statusText,
        message: error.data,
      };
    }

    return {
      title: "Oops!",
      subtitle: "Something went wrong.",
    };
  }, [error]);

  return {
    ...errorDisplay,
  };
}
