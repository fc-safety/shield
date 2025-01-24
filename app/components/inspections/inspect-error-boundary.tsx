import { Frown, Nfc } from "lucide-react";
import { isRouteErrorResponse } from "react-router";
import { isNil } from "~/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";

export default function InspectErrorBoundary({ error }: { error: unknown }) {
  return (
    <Card className="max-w-lg w-full">
      <CardHeader className="text-center">
        <CardTitle className="text-4xl">
          Oops <Frown className="inline size-8" />
        </CardTitle>
        <CardDescription>Something didn&#39;t work.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-2">
        <p className="text-center text-sm">
          Try again or scan a different tag
          <Nfc className="inline size-4 text-primary" />
        </p>

        {!isNil(error) && isRouteErrorResponse(error) && (
          <p className="mt-6 text-muted-foreground text-sm">
            Error details: {error.data}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
