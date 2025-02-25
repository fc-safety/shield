import Fuse from "fuse.js";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFetcher } from "react-router";
import type { ViewContext } from "~/.server/api-utils";
import type { Asset, ResultsPage } from "~/lib/models";
import { stringifyQuery, type QueryParams } from "~/lib/urls";
import { objectsEqual } from "~/lib/utils";
import { ResponsiveCombobox } from "../responsive-combobox";

interface AssetComboboxProps {
  value?: string | undefined;
  onValueChange?: (value: string | undefined) => void;
  onBlur?: () => void;
  className?: string;
  optionFilter?: (asset: Asset) => boolean;
  optionQueryFilter?: QueryParams;
  disabled?: boolean;
  context?: ViewContext;
}

const fuse = new Fuse([] as Asset[], { keys: ["name"] });

export default function AssetCombobox({
  value,
  onValueChange,
  onBlur,
  className,
  optionFilter = () => true,
  optionQueryFilter,
  disabled = false,
  context,
}: AssetComboboxProps) {
  const fetcher = useFetcher<ResultsPage<Asset>>();
  const prevQueryFilter = useRef<QueryParams | null>(null);

  const preloadAssets = useCallback(() => {
    const queryFilterChanged = !objectsEqual(
      optionQueryFilter ?? null,
      prevQueryFilter.current
    );
    if (fetcher.state === "idle" && (queryFilterChanged || !fetcher.data)) {
      if (optionQueryFilter) {
        prevQueryFilter.current = optionQueryFilter;
      }
      fetcher.load(
        `/api/proxy/assets?${stringifyQuery({
          limit: 10000,
          _viewContext: context,
          ...optionQueryFilter,
        })}`
      );
    }
  }, [fetcher, optionQueryFilter, context]);

  useEffect(() => {
    if (value) preloadAssets();
  }, [value, preloadAssets]);

  const [assets, setAssets] = useState<Asset[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (fetcher.data) {
      setAssets(fetcher.data.results);
    }
  }, [fetcher.data]);

  const options = useMemo(() => {
    let filteredAssets = assets;
    if (search) {
      fuse.setCollection(assets);
      filteredAssets = fuse.search(search).map((result) => result.item);
    }
    return filteredAssets.filter(optionFilter).map((asset) => ({
      label: asset.name,
      value: asset.id,
    }));
  }, [assets, search, optionFilter]);

  return (
    <ResponsiveCombobox
      value={value}
      onValueChange={onValueChange}
      onBlur={onBlur}
      displayValue={(value) =>
        assets.find((asset) => asset.id === value)?.name ?? <>&mdash;</>
      }
      loading={fetcher.state === "loading"}
      options={options}
      onMouseOver={() => !disabled && preloadAssets()}
      searchValue={search}
      onSearchValueChange={setSearch}
      className={className}
      shouldFilter={false}
      disabled={disabled}
      showClear
    />
  );
}
