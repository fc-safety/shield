import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import useBoundaryError from "~/hooks/use-boundary-error";

export default function MinimalErrorBoundary({ error }: { error: unknown }) {
  const errorDisplay = useBoundaryError({ error });

  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>
        {errorDisplay.title} {errorDisplay.subtitle}
      </AlertTitle>
      <AlertDescription>{errorDisplay.message}</AlertDescription>
    </Alert>
  );
}
