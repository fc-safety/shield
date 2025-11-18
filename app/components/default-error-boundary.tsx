import { useEffect, type PropsWithChildren } from "react";
import { Link, type To } from "react-router";
import useBoundaryError from "~/hooks/use-boundary-error";
import { openChat } from "~/lib/contact/utils";
import { Button } from "./ui/button";

export default function DefaultErrorBoundary({
  error,
  homeTo = "/",
  homeToText = "Go back home",
  children,
  errorTitle,
  errorSubtitle,
  errorMessage,
}: {
  error: unknown;
  homeTo?: To;
  homeToText?: string;
  errorTitle?: string;
  errorSubtitle?: string;
  errorMessage?: string;
} & PropsWithChildren) {
  const errorDisplay = useBoundaryError({ error });

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-muted-foreground text-base font-semibold">Error</p>
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-primary text-6xl font-bold tracking-tight sm:text-8xl">
          {errorTitle ?? errorDisplay.title}
        </h1>
        {(errorSubtitle || errorDisplay.subtitle) && (
          <p className="text-secondary-foreground text-base leading-7">
            {errorSubtitle ?? errorDisplay.subtitle}
          </p>
        )}
      </div>
      {children}
      {(errorMessage || errorDisplay.message) && (
        <div className="w-full max-w-sm">
          <div className="text-secondary-foreground mb-1 text-xs font-semibold">
            System Message:
          </div>
          <p className="border-destructive text-destructive bg-destructive/10 rounded-md border px-4 py-2 font-mono text-xs">
            <span>{errorMessage ?? errorDisplay.message}</span>
          </p>
        </div>
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
          <Link to={homeTo}>{homeToText}</Link>
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
