import { buildImageProxyUrl } from "~/.server/images";
import { getSearchParams, isNil } from "~/lib/utils";
import type { Route } from "./+types/image-proxy-url";

export const loader = async ({ request }: Route.LoaderArgs) => {
  const query = getSearchParams(request);

  const processingOptions: string[] = [];

  const sourceUrl = query.get("src");
  const preset = query.get("pre");

  if (isNil(sourceUrl)) {
    throw new Response("Missing `src` parameter.", { status: 400 });
  }

  // NOTE: The whole point of signed image proxy urls is to prevent abuse. Here we are very strict
  // about what parameters are allowed. For example, an arbitrary size parameter could be used to
  // process a large number of different sized images, which could block the server.
  switch (preset) {
    case "square":
      const sizePreset = query.get("size");
      if (isNil(sizePreset)) {
        throw new Response(
          "Required parameter `size` is missing for preset `square`.",
          { status: 400 }
        );
      }

      let size: number | null = null;
      switch (sizePreset) {
        case "160":
        default:
          size = 160;
          break;
      }

      processingOptions.push(`rs:fit:${size}:${size}:1:1`);
      break;
    default:
      throw new Response(
        "Invalid preset (`pre`) provided. Valid options are: `square`.",
        { status: 400 }
      );
  }

  return Response.json({
    imageUrl: buildImageProxyUrl(sourceUrl, processingOptions),
  });
};
