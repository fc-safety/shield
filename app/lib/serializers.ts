type TFormJsonPrimitive = string | number | boolean | null | undefined | Date;
type TFormJsonValue = TFormJsonPrimitive | TFormJsonValue[] | { [key: string]: TFormJsonValue };

/**
 * Transforms a type T (extending TFormJsonValue) into a type that matches the structure of T,
 * but with all values constrained to TSafeJsonValue, i.e., strips undefined and Date, and
 * converts Dates to string, recursively, as serializeFormJson does at runtime.
 */
export type SafeFormJson<T extends TFormJsonValue> =
  // Handle array case
  T extends Array<infer U extends TFormJsonValue>
    ? Array<SafeFormJson<U>>
    : // Handle Date: convert to string
      T extends Date
      ? string
      : // Handle object (excluding arrays and null)
        T extends object & Record<string, TFormJsonValue>
        ? T extends null
          ? null
          : {
              [K in keyof T as T[K] extends undefined | Date ? never : K]: SafeFormJson<
                Exclude<T[K], undefined | Date>
              >;
            } & {
              // For required Date properties on the object, convert them to string
              [K in keyof T as T[K] extends Date ? K : never]: string;
            }
        : // Handle primitives (keep as-is except exclude undefined)
          T extends undefined
          ? never
          : T;

/**
 * Serializes a form data object into a JSON-serializable object.
 * This effectively strips undefined and Date values, and converts Dates to string, recursively.
 *
 * @param data - The data to serialize.
 * @returns The serialized data.
 */
export const serializeFormJson = <T extends Exclude<TFormJsonValue, undefined>>(
  data: T
): SafeFormJson<T> => {
  const serializeValue = <U extends Exclude<TFormJsonValue, undefined>>(
    value: U
  ): SafeFormJson<U> => {
    if (value instanceof Date) {
      return value.toISOString() as SafeFormJson<U>;
    }
    if (Array.isArray(value)) {
      return value.filter((v) => v !== undefined).map(serializeValue) as SafeFormJson<U>;
    }
    if (typeof value === "object" && value !== null) {
      return Object.fromEntries(
        Object.entries(value)
          .filter((kv): kv is [string, Exclude<TFormJsonValue, undefined>] => kv[1] !== undefined)
          .map(([key, value]) => [key, serializeValue(value)])
      ) as SafeFormJson<U>;
    }
    return value as SafeFormJson<U>;
  };

  return serializeValue(data);
};
