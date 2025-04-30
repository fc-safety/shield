import { useMemo } from "react";
import { isRouteErrorResponse } from "react-router";

export default function useBoundaryError({ error }: { error: unknown }) {
  const errorDisplay = useMemo(() => {
    if (isRouteErrorResponse(error) || error instanceof Response) {
      return {
        title: error.status,
        subtitle: error.statusText || undefined,
        message: error instanceof Response ? "" : parseErrorMessage(error.data),
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

const parseErrorMessage = (error: unknown) => {
  if (error === null || error === undefined) {
    return "Unknown error";
  }

  let errObj: Record<string, unknown> = {};
  if (typeof error === "object") {
    errObj = error as Record<string, unknown>;
  } else if (typeof error === "string") {
    try {
      errObj = JSON.parse(error);
    } catch (e) {
      errObj = { message: error };
    }
  }

  if ("message" in errObj) {
    return String(errObj.message);
  }

  return String(error);
};
