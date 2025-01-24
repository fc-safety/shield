import Fuse from "fuse.js";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFetcher } from "react-router";
import type { ResultsPage, Site } from "~/lib/models";
import { buildPath, type QueryParams } from "~/lib/urls";
import { ResponsiveCombobox } from "../responsive-combobox";

interface SiteComboboxProps {
  value?: string | undefined;
  onValueChange?: (value: string | undefined) => void;
  onBlur?: () => void;
  className?: string;
  clientId?: string;
  valueKey?: "id" | "externalId";
  disabled?: boolean;
  showClear?: boolean;
}

const fuse = new Fuse([] as Site[], { keys: ["name"] });

export default function SiteCombobox({
  value,
  onValueChange,
  onBlur,
  className,
  clientId,
  valueKey = "id",
  disabled,
  showClear = true,
}: SiteComboboxProps) {
  const fetcher = useFetcher<ResultsPage<Site>>();
  const prevClientId = useRef<string | null>(null);

  const preloadSites = useCallback(
    (clientId?: string) => {
      if (
        fetcher.state === "idle" &&
        ((clientId && clientId !== prevClientId.current) || !fetcher.data)
      ) {
        const query: QueryParams = {
          limit: 10000,
        };
        if (clientId) {
          prevClientId.current = clientId;
          query.clientId = clientId;
        }
        fetcher.load(buildPath("/api/proxy/sites", query));
      }
    },
    [fetcher]
  );

  useEffect(() => {
    if (value) preloadSites(clientId);
  }, [value, preloadSites, clientId]);

  const [sites, setSites] = useState<Site[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (fetcher.data) {
      setSites(fetcher.data.results);
    }
  }, [fetcher.data]);

  const options = useMemo(() => {
    let filteredSites = sites;
    if (search) {
      fuse.setCollection(sites);
      filteredSites = fuse.search(search).map((result) => result.item);
    }
    return filteredSites.map((c) => ({
      label: c.name,
      value: c[valueKey],
    }));
  }, [sites, search, valueKey]);

  return (
    <ResponsiveCombobox
      value={value}
      onValueChange={onValueChange}
      onBlur={onBlur}
      displayValue={(value) =>
        sites.find((c) => c[valueKey] === value)?.name ?? <>&mdash;</>
      }
      loading={fetcher.state === "loading"}
      options={options}
      onMouseEnter={() => preloadSites(clientId)}
      searchValue={search}
      onSearchValueChange={setSearch}
      className={className}
      shouldFilter={false}
      showClear={showClear}
      disabled={disabled}
    />
  );
}
