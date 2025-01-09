import { parse } from "node-html-parser";
import { logger } from "~/.server/logger";
import type { Route } from "./+types/link-preview-metadata";

export async function loader({ request }: Route.LoaderArgs) {
  const requestUrl = URL.parse(request.url);
  const url = requestUrl?.searchParams.get("url");

  if (!url) {
    throw new Response("Query parameter 'url' is required", { status: 400 });
  }

  const response = await fetch(url, {
    redirect: "follow",
    headers: {
      Accept: "text/html",
    },
  });

  if (!response.ok) {
    logger.warn(
      { url, status: response.status },
      "Failed to get link preview metadata"
    );
    throw new Response("Failed to get link preview metadata", { status: 500 });
  }

  const html = await response.text();

  let document: ReturnType<typeof parse>;
  try {
    document = parse(html);
  } catch (error) {
    throw new Response("Failed to parse link URL", {
      status: 500,
    });
  }

  const getMetaContent = (...names: string[]) => {
    for (const type of ["name", "property"]) {
      for (const name of names) {
        const meta = document.querySelector(`meta[${type}=${name}]`);
        if (meta) {
          return meta.getAttribute("content") ?? "";
        }
      }
    }
    return "";
  };

  const getSafely = (selectorFn: () => void, defaultValue = "") => {
    try {
      return selectorFn() ?? "";
    } catch (e) {
      logger.warn({ e }, "Failed to parse link preview metadata");
      return defaultValue;
    }
  };

  const asAbsolute = (path: string) => {
    if (!path) {
      return "";
    }

    if (path.startsWith("http")) {
      return path;
    }

    try {
      return new URL(path, response.url).href;
    } catch (e) {
      return path;
    }
  };

  const title = getSafely(() => document.querySelector("title")?.textContent);
  const description = getSafely(() =>
    getMetaContent("description", "og:description")
  );
  const image = getSafely(() => getMetaContent("og:image"));
  const favicon = getSafely(
    () =>
      document.querySelector("#favicon")?.getAttribute("href") ||
      document
        .querySelector('link[rel="shortcut icon"]')
        ?.getAttribute("href") ||
      document.querySelector("link[rel=icon]")?.getAttribute("href")
  );

  return Response.json({
    title,
    description,
    image: asAbsolute(image),
    favicon: asAbsolute(favicon),
  });
}
