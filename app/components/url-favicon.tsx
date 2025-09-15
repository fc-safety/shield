import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useAuthenticatedFetch } from "~/hooks/use-authenticated-fetch";
import { buildPath } from "~/lib/urls";

export default function URLFavicon({
  url,
  alt = "",
  fallback,
}: {
  url: string;
  alt?: string;
  fallback?: React.ReactNode;
}) {
  const { fetchOrThrow } = useAuthenticatedFetch();
  const { data: metadata, isLoading } = useQuery({
    queryFn: () => getUrlPreviewMetadataFn(fetchOrThrow, url),
    queryKey: ["url-preview-metadata", url],
  });
  const [hasError, setHasError] = useState(false);

  if (isLoading) {
    return <Loader2 className="size-4 animate-spin" />;
  }

  if (hasError) {
    return fallback ? fallback : null;
  }

  return metadata?.favicon ? (
    <img
      src={metadata.favicon}
      alt={alt}
      onError={() => setHasError(true)}
      className="size-5 rounded p-0.5"
    />
  ) : fallback ? (
    fallback
  ) : null;
}

const getUrlPreviewMetadataFn = async (fetcher: typeof fetch, url: string) => {
  const response = await fetcher("self://" + buildPath("api/link-preview-metadata", { url }));
  return response.json() as Promise<{
    title: string;
    description: string;
    image: string;
    favicon: string;
  }>;
};
