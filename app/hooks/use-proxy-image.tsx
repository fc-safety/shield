import { useEffect, useState } from "react";
import { useFetcher } from "react-router";
import { buildPath } from "~/lib/urls";

type SquareSizePresets = "160";
type ImagePreset = "square";
type Options<T extends ImagePreset> = {
  size: T extends "square" ? SquareSizePresets : never;
};

export const useProxyImage = <T extends ImagePreset>(
  sourceUrl: string,
  preset: T,
  options: Options<T>
) => {
  const [proxyImageUrl, setProxyImageUrl] = useState<string | null>(null);
  const fetcher = useFetcher();

  useEffect(() => {
    if (fetcher.state === "idle" && !fetcher.data) {
      fetcher.load(
        buildPath("/api/image-proxy-url", {
          src: sourceUrl,
          pre: preset,
          ...options,
        })
      );
    }
  }, [sourceUrl, preset, options]);

  useEffect(() => {
    if (fetcher.data) {
      setProxyImageUrl(fetcher.data.imageUrl);
    }
  }, [fetcher.data]);

  return {
    proxyImageUrl,
  };
};
