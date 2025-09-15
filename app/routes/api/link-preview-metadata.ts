import { parse } from "node-html-parser";
import { logger } from "~/.server/logger";
import { validateSearchParam } from "~/lib/utils";
import type { Route } from "./+types/link-preview-metadata";

function parseURL(input: string): URL | null {
  try {
    // If the input already includes a protocol, try to parse it directly
    const hasProtocol = /^[a-z][a-z\d+\-.]*:\/\//i.test(input);
    const url = new URL(hasProtocol ? input : `http://${input}`);
    return url;
  } catch (error) {
    // If parsing fails, return null to indicate an invalid URL
    return null;
  }
}

export async function loader({ request }: Route.LoaderArgs) {
  const rawUrl = validateSearchParam(request, "url");
  const url = parseURL(rawUrl);

  if (!url) {
    throw new Response(`URL "${url}" is invalid`, { status: 400 });
  }

  let response: Response;
  try {
    response = await fetch(url, {
      redirect: "follow",
      headers: {
        Accept: "text/html",
      },
    });
  } catch (error) {
    logger.warn({ error }, "Failed to fetch link preview metadata");
    throw new Response("Failed to get link preview metadata", { status: 500 });
  }

  if (!response.ok) {
    logger.warn({ url, status: response.status }, "Failed to get link preview metadata");
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
  const description = getSafely(() => getMetaContent("description", "og:description"));
  const image = getSafely(() => getMetaContent("og:image"));
  const favicon = getSafely(
    () =>
      document.querySelector("#favicon")?.getAttribute("href") ||
      document.querySelector('link[rel="shortcut icon"]')?.getAttribute("href") ||
      document.querySelector("link[rel=icon]")?.getAttribute("href")
  );

  return Response.json({
    title,
    description,
    image: asAbsolute(image),
    favicon: asAbsolute(favicon),
  });
}
