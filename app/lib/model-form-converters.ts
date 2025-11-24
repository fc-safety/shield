import { nullValuesToUndefined } from "./utils";

export const toUpdateMany = <T extends { id: string }>(items: T[] | null | undefined) => {
  return items
    ? items.map((item) => ({
        where: { id: item.id },
        data: { ...nullValuesToUndefined(item) },
      }))
    : undefined;
};

type ConnectOrEmpty =
  | {
      connect: {
        id: string;
      };
    }
  | undefined;

export function connectOrEmpty(connectId: string | null | undefined): ConnectOrEmpty;
export function connectOrEmpty<T, K extends keyof T>(
  item: T | null | undefined,
  idKey: K
): ConnectOrEmpty;
export function connectOrEmpty<T, K extends keyof T>(
  item: T | string | null | undefined,
  idKey?: K
) {
  const id = idKey ? (item as T | null | undefined)?.[idKey] : (item as string | null | undefined);
  return id && id !== ""
    ? {
        connect: {
          id,
        },
      }
    : undefined;
}
