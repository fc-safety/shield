import { Link, type To } from "react-router";
import useBoundaryError from "~/hooks/use-boundary-error";
import { openChat } from "~/lib/contact/utils";
import { Button } from "./ui/button";

export default function DefaultErrorBoundary({
  error,
  homeTo = "/",
}: {
  error: unknown;
  homeTo?: To;
}) {
  const errorDisplay = useBoundaryError({ error });

  return (
    <div className="text-center">
      <p className="text-muted-foreground text-base font-semibold">Error</p>
      <h1 className="text-primary mt-4 text-6xl font-bold tracking-tight sm:text-8xl">
        {errorDisplay.title}
      </h1>
      {errorDisplay.subtitle && (
        <p className="text-secondary-foreground mt-2 text-base leading-7">
          {errorDisplay.subtitle}
        </p>
      )}
      {errorDisplay.message && (
        <p className="text-muted-foreground mt-6 text-sm">Message: {errorDisplay.message}</p>
      )}
      <p className="mt-10 text-sm">
        Try{" "}
        <button className="text-primary underline" onClick={() => window.location.reload()}>
          refreshing the page
        </button>
        , or
      </p>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        <Button asChild>
          <Link to={homeTo}>Go back home</Link>
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            openChat();
          }}
        >
          Contact support <span aria-hidden="true">&rarr;</span>
        </Button>
      </div>
    </div>
  );
}
