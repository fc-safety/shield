import type { FieldValues, Resolver } from "react-hook-form";
import { getValidatedFormData } from "remix-hook-form";

export const getValidatedFormDataOrThrow = async <T extends FieldValues>(
  request: Request | FormData,
  resolver: Resolver<T>,
  preserveStringified?: boolean
) => {
  const { data, errors, receivedValues } = await getValidatedFormData<T>(
    request,
    resolver,
    preserveStringified
  );
  if (errors) {
    throw Response.json({ errors }, { status: 400 });
  }
  return { data: data as T, receivedValues };
};
