import Fuse from "fuse.js";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFetcher } from "react-router";
import type { DataOrError } from "~/.server/api-utils";
import { useViewContext } from "~/contexts/view-context";
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
  includeSiteGroups?: boolean | "exclusively";
  nestDrawers?: boolean;
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
  includeSiteGroups = false,
  nestDrawers,
}: SiteComboboxProps) {
  const viewContext = useViewContext();
  const fetcher = useFetcher<DataOrError<ResultsPage<Site>>>();
  const prevClientId = useRef<string | null>(null);
  const prevIncludeSiteGroups = useRef<boolean | "exclusively">(false);

  const preloadSites = useCallback(
    (clientId?: string) => {
      if (
        fetcher.state === "idle" &&
        ((clientId && clientId !== prevClientId.current) ||
          includeSiteGroups !== prevIncludeSiteGroups.current ||
          !fetcher.data)
      ) {
        prevIncludeSiteGroups.current = includeSiteGroups;
        const query: QueryParams = {
          limit: 10000,
          _throw: "false",
        };
        if (clientId) {
          prevClientId.current = clientId;
          query.clientId = clientId;
        }
        if (viewContext) {
          query._viewContext = viewContext;
        }
        if (!includeSiteGroups) {
          // This special query ensures that only sites without children are returned.
          query.subsites = { none: "" };
        } else if (includeSiteGroups === "exclusively") {
          // This special query ensures that only sites with children are returned.
          query.subsites = { some: "" };
        }
        const url = buildPath("/api/proxy/sites", query);
        fetcher.load(url);
      }
    },
    [fetcher, viewContext, includeSiteGroups]
  );

  useEffect(() => {
    if (value) preloadSites(clientId);
  }, [value, preloadSites, clientId]);

  const [sites, setSites] = useState<Site[]>([]);
  const [search, setSearch] = useState("");
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (fetcher.data?.data) {
      setSites(fetcher.data.data.results.filter((s) => s.active || s[valueKey] === value));
    } else if (fetcher.data?.error) {
      console.error("Failed to fetch sites", fetcher.data.error);
      setHasError(true);
    }
  }, [fetcher.data, valueKey]);

  const options = useMemo(() => {
    let filteredSites = sites;
    if (search) {
      fuse.setCollection(sites);
      filteredSites = fuse.search(search).map((result) => result.item);
    }
    return filteredSites.map((s) => ({
      label: s.name,
      value: s[valueKey],
      disabled: !s.active,
    }));
  }, [sites, search, valueKey]);

  return (
    <ResponsiveCombobox
      value={value}
      onValueChange={onValueChange}
      onBlur={onBlur}
      displayValue={(value) => sites.find((c) => c[valueKey] === value)?.name ?? <>&mdash;</>}
      loading={fetcher.state === "loading"}
      options={options}
      onMouseOver={() => !disabled && preloadSites(clientId)}
      onTouchStart={() => !disabled && preloadSites(clientId)}
      onKeyDown={(e) => {
        if (e.key === "Enter" && !disabled) {
          preloadSites(clientId);
        }
      }}
      searchValue={search}
      onSearchValueChange={setSearch}
      className={className}
      shouldFilter={false}
      showClear={showClear}
      disabled={disabled}
      errorMessage={hasError ? "Something went wrong." : undefined}
      isNestedDrawer={nestDrawers}
    />
  );
}
