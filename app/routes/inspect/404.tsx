import DefaultErrorBoundary from "~/components/default-error-boundary";

export default function page404() {
  return (
    <DefaultErrorBoundary
      error={{
        status: 404,
        statusText: "Not Found",
        internal: true,
        data: "Page not found",
      }}
      homeTo="/inspect"
    />
  );
}
