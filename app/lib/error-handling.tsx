import { AlertCircle } from "lucide-react";
import type { ReactNode } from "react";
import { z } from "zod";
import { cn } from "./utils";

export const validationErrorSchema = z.object({
  statusCode: z.number(),
  message: z.string(),
  errors: z.array(
    z.object({
      code: z.string(),
      expected: z.string(),
      received: z.string(),
      path: z.array(z.string()),
      message: z.string(),
    })
  ),
});

const attempt = <T,>(fn: () => T) => {
  try {
    return fn();
  } catch {
    /* empty */
  }
};

const ErrorTitle = ({
  className,
  children,
}: {
  className?: string;
  children: ReactNode | ReactNode[];
}) => (
  <div
    className={cn("font-semibold text-xs flex gap-1 items-center", className)}
  >
    {children}
  </div>
);

const buildValidationErrorDisplay = (error: unknown) => {
  const validationError = validationErrorSchema.parse(error);
  return (
    <div className="grid gap-2">
      <ErrorTitle className="text-important">
        <AlertCircle className="size-4 shrink-0" />
        {validationError.message}
      </ErrorTitle>
      <ul>
        {validationError.errors.map((error) => (
          <li key={error.message} className="capitalize">
            Field {error.path.join(" > ")}: {error.message}
          </li>
        ))}
      </ul>
    </div>
  );
};

export const buildErrorDisplay = (
  error: unknown,
  options: {
    defaultErrorMessage?: string;
  } = {}
) => {
  let content: ReactNode;
  content ??= attempt(() => buildValidationErrorDisplay(error));
  content ??= (
    <ErrorTitle className="text-urgent">
      <AlertCircle className="size-4 shrink-0" />
      {options.defaultErrorMessage ?? "Error: Something went wrong."}
    </ErrorTitle>
  );
  return content;
};
