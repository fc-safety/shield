import { nullValuesToUndefined } from "./utils";

export const toUpdateMany = <T extends { id: string }>(items: T[] | null | undefined) => {
  return items
    ? items.map((item) => ({
        where: { id: item.id },
        data: { ...nullValuesToUndefined(item) },
      }))
    : undefined;
};

export const connectOrEmpty = <T, K extends keyof T>(item: T | null | undefined, idKey: K) => {
  return item && item[idKey]
    ? {
        connect: {
          id: item[idKey],
        },
      }
    : undefined;
};
