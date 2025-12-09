import * as Sentry from "@sentry/react-router";
import { useMemo } from "react";
import { isRouteErrorResponse } from "react-router";
import { isNil } from "~/lib/utils";

export default function useBoundaryError({ error }: { error: unknown }) {
  const errorDisplay = useMemo(() => {
    if (isRouteErrorResponse(error) || error instanceof Response) {
      return {
        title: error.status,
        subtitle: error.statusText || undefined,
        message: error instanceof Response ? "" : parseErrorMessage(error.data),
      };
    } else if (error && error instanceof Error) {
      Sentry.captureException(error);
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

const parseErrorMessage = (error: unknown, noJson = false): string => {
  if (isNil(error)) {
    return "Unknown error";
  }

  if (Array.isArray(error)) {
    return error.map((e) => parseErrorMessage(e, noJson)).join("\n");
  }

  let errObj: Record<string, unknown> = {};
  if (typeof error === "object") {
    errObj = error as Record<string, unknown>;
  } else if (typeof error === "string") {
    if (noJson) {
      errObj = { message: error };
    } else {
      try {
        const errorJson = JSON.parse(error);
        return parseErrorMessage(errorJson);
      } catch (e) {
        errObj = { message: error };
      }
    }
  }

  if ("message" in errObj) {
    return String(errObj.message);
  }

  return String(error);
};
