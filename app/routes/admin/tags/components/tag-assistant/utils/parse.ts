import { z } from "zod";

const tagUrlSchema = z.object({
  serialNumber: z.string(),
  externalId: z.string(),
});

export const parseTagUrl = (tagUrl: string) => {
  const params = new URL(tagUrl).searchParams;

  return tagUrlSchema.parse({
    serialNumber: params.get("sn"),
    externalId: params.get("id"),
  });
};
