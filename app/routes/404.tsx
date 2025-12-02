import DefaultErrorBoundary from "~/components/default-error-boundary";
import type { Route } from "./+types/404";

export function loader() {
  throw new Response("Page not found", { status: 404 });
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <DefaultErrorBoundary error={error} />;
}

export default function Page404() {
  return (
    <DefaultErrorBoundary
      error={{
        status: 404,
        statusText: "Not Found",
        internal: true,
        data: "Page not found",
      }}
    />
  );
}
