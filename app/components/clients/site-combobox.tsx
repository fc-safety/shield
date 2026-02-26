import Fuse from "fuse.js";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { DataOrError } from "~/.server/api-utils";
import { useModalFetcher } from "~/hooks/use-modal-fetcher";
import type { ResultsPage, Site } from "~/lib/models";
import { type QueryParams } from "~/lib/urls";
import { ResponsiveCombobox } from "../responsive-combobox";

interface SiteComboboxProps {
  value?: string | undefined;
  onValueChange?: (value: string | undefined) => void;
  onBlur?: () => void;
  className?: string;
  clientId?: string;
  valueKey?: "id" | "externalId";
  disabled?: boolean;
  readOnly?: boolean;
  showClear?: boolean;
  placeholder?: string;
  includeSiteGroups?: boolean | "exclusively";
  nestDrawers?: boolean;
  preloadOnMount?: boolean;
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
  readOnly,
  placeholder,
  includeSiteGroups = false,
  nestDrawers,
  preloadOnMount = false,
}: SiteComboboxProps) {
  const prevClientId = useRef<string | null>(null);
  const prevIncludeSiteGroups = useRef<boolean | "exclusively">(false);

  const [sites, setSites] = useState<Site[]>([]);
  const {
    load,
    isLoading,
    data: fetcherData,
  } = useModalFetcher<DataOrError<ResultsPage<Site>>>({
    onData: (data) => {
      if (data.data) {
        setSites(data.data.results.filter((s) => s.active || s[valueKey] === value));
      }
    },
  });

  const preloadSites = useCallback(
    (clientId?: string) => {
      if (
        !clientId ||
        clientId !== prevClientId.current ||
        includeSiteGroups !== prevIncludeSiteGroups.current
      ) {
        prevIncludeSiteGroups.current = includeSiteGroups;
        const query: QueryParams = {
          limit: 10000,
        };
        if (clientId) {
          prevClientId.current = clientId;
          query.clientId = clientId;
        }

        if (!includeSiteGroups) {
          // This special query ensures that only sites without children are returned.
          query.subsites = { none: "" };
        } else if (includeSiteGroups === "exclusively") {
          // This special query ensures that only sites with children are returned.
          query.subsites = { some: "" };
        }

        load({
          path: "/api/proxy/sites",
          query,
        });
      }
    },
    [load, includeSiteGroups]
  );

  useEffect(() => {
    if (!fetcherData && value) preloadSites(clientId);
  }, [value, preloadSites, clientId, fetcherData]);

  useEffect(() => {
    if (preloadOnMount && !fetcherData) preloadSites(clientId);
  }, [preloadOnMount, clientId, fetcherData, preloadSites]);

  useEffect(() => {
    if (preloadOnMount && !value && sites.length > 0) {
      onValueChange?.(sites[0].id);
    }
  }, [value, sites, onValueChange, preloadOnMount]);

  const [search, setSearch] = useState("");

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
      loading={isLoading}
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
      readOnly={readOnly}
      placeholder={placeholder}
      errorMessage={fetcherData?.error ? "Something went wrong." : undefined}
      isNestedDrawer={nestDrawers}
    />
  );
}
