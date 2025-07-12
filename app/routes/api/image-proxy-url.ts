import { z } from "zod";
import { buildImageProxyUrl } from "~/.server/images";
import { getSearchParams } from "~/lib/utils";
import type { Route } from "./+types/image-proxy-url";

// NOTE: The whole point of signed image proxy urls is to prevent abuse. Here we are very strict
// about what parameters are allowed. For example, an arbitrary size parameter could be used to
// process a large number of different sized images, which could block the server.
const imageProxyUrlOptionsSchema = z.intersection(
  z.object({
    src: z.string(),
  }),
  z.discriminatedUnion("pre", [
    z.object({
      pre: z.literal("square"),
      size: z.enum(["96", "160"]),
    }),
  ])
);

export type ImageProxyUrlOptions = z.infer<typeof imageProxyUrlOptionsSchema>;

const bulkImageProxyUrlOptionsSchema = z.union([
  imageProxyUrlOptionsSchema,
  z.array(imageProxyUrlOptionsSchema),
]);

export const action = async ({ request }: Route.ActionArgs) => {
  const body = await request.json();
  const parseResult = bulkImageProxyUrlOptionsSchema.safeParse(body);

  if (parseResult.error) {
    throw new Response(parseResult.error.message, { status: 400 });
  }

  const payload = Array.isArray(parseResult.data)
    ? parseResult.data
    : [parseResult.data];

  return Response.json({
    results: payload.map((p) => ({
      sourceUrl: p.src,
      imageUrl: buildImageProxyUrl(p.src, buildProcessingOptions(p)),
    })),
  });
};

export const loader = async ({ request }: Route.LoaderArgs) => {
  const query = getSearchParams(request);

  const queryParseResult = imageProxyUrlOptionsSchema.safeParse(query);

  if (queryParseResult.error) {
    throw new Response(queryParseResult.error.message, { status: 400 });
  }

  const payload = queryParseResult.data;
  const { src: sourceUrl, pre: preset } = payload;

  const processingOptions = buildProcessingOptions(payload);

  return Response.json({
    imageUrl: buildImageProxyUrl(sourceUrl, processingOptions),
  });
};

const buildProcessingOptions = (payload: ImageProxyUrlOptions) => {
  const processingOptions: string[] = [];

  switch (payload.pre) {
    case "square":
      let size: number | null = null;
      switch (payload.size) {
        case "96":
          size = 96;
          break;
        case "160":
          size = 160;
          break;
      }

      if (size) {
        processingOptions.push(`rs:fit:${size}:${size}:1:1`);
      }
      break;
  }

  return processingOptions;
};
