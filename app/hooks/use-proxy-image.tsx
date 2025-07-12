import { useEffect, useRef, useState } from "react";
import { useFetcher } from "react-router";
import { buildPath } from "~/lib/urls";
import type { ImageProxyUrlOptions } from "~/routes/api/image-proxy-url";

export const useProxyImage = (
  options: ImageProxyUrlOptions | ImageProxyUrlOptions[]
) => {
  const [proxyImageUrl, setProxyImageUrl] = useState<string | null>(null);
  const [proxyImageUrls, setProxyImageUrls] = useState<
    | {
        sourceUrl: string;
        imageUrl: string;
      }[]
    | null
  >(null);
  const fetcher = useFetcher();
  const lastOptionsRef = useRef<string | null>(null);

  useEffect(() => {
    // Deep comparison to prevent redundant requests
    const currentOptionsString = JSON.stringify(options);

    if (
      fetcher.state === "idle" &&
      lastOptionsRef.current !== currentOptionsString
    ) {
      lastOptionsRef.current = currentOptionsString;

      if (Array.isArray(options)) {
        fetcher.submit(options, {
          method: "POST",
          action: "/api/image-proxy-url",
          encType: "application/json",
        });
      } else {
        fetcher.load(buildPath("/api/image-proxy-url", options));
      }
    }
  }, [options]);

  useEffect(() => {
    if (fetcher.data) {
      console.log(fetcher.data);
      if (fetcher.data.imageUrl) {
        setProxyImageUrl(fetcher.data.imageUrl);
      }
      if (fetcher.data.results) {
        setProxyImageUrls(fetcher.data.results);
      }
    }
  }, [fetcher.data]);

  return {
    proxyImageUrl,
    proxyImageUrls,
  };
};
