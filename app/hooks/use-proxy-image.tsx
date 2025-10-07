import { useEffect, useRef, useState } from "react";
import type {
  ImageProxyUrlGetResponse,
  ImageProxyUrlOptions,
  ImageProxyUrlPostResponse,
} from "~/routes/api/image-proxy-url";
import { useModalFetcher } from "./use-modal-fetcher";

export const useProxyImage = (options: ImageProxyUrlOptions | ImageProxyUrlOptions[]) => {
  const [proxyImageUrl, setProxyImageUrl] = useState<string | null>(null);
  const [proxyImageUrls, setProxyImageUrls] = useState<
    | {
        sourceUrl: string;
        imageUrl: string;
      }[]
    | null
  >(null);
  const lastOptionsRef = useRef<string | null>(null);

  const { load, submitJson, isLoading } = useModalFetcher<
    ImageProxyUrlPostResponse | ImageProxyUrlGetResponse
  >({
    onData: (data) => {
      if ("results" in data) {
        setProxyImageUrls(data.results);
      }
      if ("imageUrl" in data) {
        setProxyImageUrl(data.imageUrl);
      }
    },
  });

  useEffect(() => {
    // Deep comparison to prevent redundant requests
    const currentOptionsString = JSON.stringify(options);

    if (!isLoading && lastOptionsRef.current !== currentOptionsString) {
      lastOptionsRef.current = currentOptionsString;

      if (Array.isArray(options)) {
        submitJson(options, {
          method: "POST",
          path: "/api/image-proxy-url",
        });
      } else {
        load({ path: "/api/image-proxy-url", query: options });
      }
    }
  }, [options, isLoading]);

  return {
    proxyImageUrl,
    proxyImageUrls,
    isLoading,
  };
};
