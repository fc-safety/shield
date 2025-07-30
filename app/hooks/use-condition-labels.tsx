import { useCallback, useRef, useState } from "react";
import { useAuthenticatedFetch } from "~/hooks/use-authenticated-fetch";

interface LabelCache {
  [key: string]: string;
}

interface LoadingState {
  [key: string]: boolean;
}

interface PendingFetch {
  [key: string]: Promise<string>;
}

// Global cache shared across all instances
const globalCache = new Map<string, { label: string; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function useConditionLabels() {
  const [labels, setLabels] = useState<LabelCache>({});
  const [loading, setLoading] = useState<LoadingState>({});
  const pendingFetches = useRef<PendingFetch>({});
  const { fetchOrThrow } = useAuthenticatedFetch();

  const fetchLabel = useCallback(
    async (type: string, id: string): Promise<string> => {
      const cacheKey = `${type}:${id}`;

      // Check in-memory cache first
      const cached = globalCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        // Update local state with cached value
        setLabels((prev) => ({ ...prev, [cacheKey]: cached.label }));
        setLoading((prev) => ({ ...prev, [cacheKey]: false }));
        return cached.label;
      }

      // Check if we're already fetching this
      if (cacheKey in pendingFetches.current) {
        return pendingFetches.current[cacheKey];
      }

      // Return ID immediately for regions or unknown types
      if (
        type === "REGION" ||
        !["PRODUCT", "MANUFACTURER", "PRODUCT_CATEGORY", "PRODUCT_SUBCATEGORY"].includes(type)
      ) {
        setLabels((prev) => ({ ...prev, [cacheKey]: id }));
        setLoading((prev) => ({ ...prev, [cacheKey]: false }));
        return id;
      }

      // Set loading state
      setLoading((prev) => ({ ...prev, [cacheKey]: true }));

      // Create the fetch promise
      const fetchPromise = (async () => {
        try {
          let path: string;

          switch (type) {
            case "PRODUCT":
              path = `/products/${id}`;
              break;
            case "MANUFACTURER":
              path = `/manufacturers/${id}`;
              break;
            case "PRODUCT_CATEGORY":
            case "PRODUCT_SUBCATEGORY":
              path = `/product-categories/${id}`;
              break;
            default:
              return id;
          }

          const response = await fetchOrThrow(path, {
            headers: {
              Accept: "application/json",
            },
          });

          const data = await response.json();
          const label = data.shortName || data.name || id;

          // Update global cache
          globalCache.set(cacheKey, {
            label,
            timestamp: Date.now(),
          });

          // Update local state
          setLabels((prev) => ({ ...prev, [cacheKey]: label }));
          setLoading((prev) => ({ ...prev, [cacheKey]: false }));

          return label;
        } catch (error) {
          console.error(`Error fetching label for ${type} ${id}:`, error);
          // Set ID as fallback on error
          setLabels((prev) => ({ ...prev, [cacheKey]: id }));
          setLoading((prev) => ({ ...prev, [cacheKey]: false }));
          return id;
        } finally {
          // Clean up pending fetch
          delete pendingFetches.current[cacheKey];
        }
      })();

      // Store the pending fetch
      pendingFetches.current[cacheKey] = fetchPromise;

      return fetchPromise;
    },
    [fetchOrThrow]
  );

  const getLabel = useCallback(
    (type: string, id: string, defaultValue?: string): string => {
      const cacheKey = `${type}:${id}`;
      return labels[cacheKey] || (defaultValue ?? id);
    },
    [labels]
  );

  const isLoading = useCallback(
    (type: string, id: string): boolean => {
      const cacheKey = `${type}:${id}`;
      return loading[cacheKey] || false;
    },
    [loading]
  );

  const prefetchLabels = useCallback(
    async (conditions: Array<{ conditionType: string; value: string[] }>) => {
      const promises: Promise<string>[] = [];

      for (const condition of conditions) {
        for (const value of condition.value) {
          promises.push(fetchLabel(condition.conditionType, value));
        }
      }

      await Promise.all(promises);
    },
    [fetchLabel]
  );

  return { fetchLabel, getLabel, prefetchLabels, labels, loading, isLoading };
}
