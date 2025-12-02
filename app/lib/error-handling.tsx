import type { ReactNode } from "react";
import { z } from "zod";
import { cn } from "./utils";

const zodValidationErrorSchema = z.object({
  code: z.string().optional(),
  expected: z.string().optional(),
  received: z.string().optional(),
  path: z.array(z.string()),
  message: z.string(),
});

export const validationErrorSchema = z.union([
  z.array(zodValidationErrorSchema),
  z.object({
    statusCode: z.number(),
    message: z.string(),
    errors: z.array(zodValidationErrorSchema),
  }),
]);

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
  <div className={cn("flex items-center gap-1 text-xs font-semibold", className)}>{children}</div>
);

const buildValidationErrorDisplay = (error: unknown) => {
  const validationError = validationErrorSchema.parse(error);
  const errors = Array.isArray(validationError) ? validationError : validationError.errors;
  const message = Array.isArray(validationError)
    ? validationError[0].message
    : validationError.message;

  return (
    <div className="grid gap-2">
      <ErrorTitle>{message}</ErrorTitle>
      <ul className="text-xs">
        {errors.map((error) => (
          <li key={error.message} className="capitalize">
            Field "{error.path.join(" > ")}": <span className="font-light">{error.message}</span>
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
    <ErrorTitle>{options.defaultErrorMessage ?? "Error: Something went wrong."}</ErrorTitle>
  );
  return content;
};
