import { useCallback, useId } from "react";
import { toast } from "sonner";
import { buildErrorDisplay } from "~/lib/error-handling";
import { asString, cleanErrorMessage, getErrorOrExtractResponseErrorMessage } from "~/lib/errors";

export const useAlertOnApiError = () => {
  const defaultErrorAlertId = useId();

  const handleError = useCallback(
    async (error: unknown) => {
      const errMsg = await getErrorOrExtractResponseErrorMessage(error);
      console.error(errMsg, { cause: error });
      if (errMsg) {
        toast.error(
          buildErrorDisplay(errMsg, {
            defaultErrorMessage: asString(cleanErrorMessage(errMsg)),
          }),
          { id: defaultErrorAlertId, duration: 10000 }
        );
        return;
      }

      toast.error(
        buildErrorDisplay(null, {
          defaultErrorMessage: "Oops! Something went wrong.",
        }),
        { id: defaultErrorAlertId, duration: 10000 }
      );
    },
    [defaultErrorAlertId]
  );

  return { handleError };
};
