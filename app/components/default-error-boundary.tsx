import { Link } from "react-router";
import useBoundaryError from "~/hooks/use-boundary-error";
import { Button } from "./ui/button";

export default function DefaultErrorBoundary({ error }: { error: unknown }) {
  const errorDisplay = useBoundaryError({ error });

  return (
    <div className="text-center">
      <p className="text-base font-semibold text-muted-foreground">Error</p>
      <h1 className="mt-4 text-6xl font-bold tracking-tight text-primary sm:text-8xl">
        {errorDisplay.title}
      </h1>
      <p className="mt-2 text-base leading-7 text-secondary-foreground">
        {errorDisplay.subtitle}
      </p>
      {errorDisplay.message && (
        <p className="mt-6 text-sm text-muted-foreground">
          Message: {errorDisplay.message}
        </p>
      )}
      <div className="mt-10 flex items-center justify-center gap-2 flex-wrap">
        <Button asChild>
          <Link to={"/"}>Go back home</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link to={"/contact"} target="_blank" rel="noreferrer">
            Contact support <span aria-hidden="true">&rarr;</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}
