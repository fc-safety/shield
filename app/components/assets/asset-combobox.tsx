import Fuse from "fuse.js";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useFetcher } from "react-router";
import type { Asset, ResultsPage } from "~/lib/models";
import { ResponsiveCombobox } from "../responsive-combobox";

interface AssetComboboxProps {
  value?: string | undefined;
  onValueChange?: (value: string | undefined) => void;
  onBlur?: () => void;
  className?: string;
  optionFilter?: (asset: Asset) => boolean;
}

const fuse = new Fuse([] as Asset[], { keys: ["name"] });

export default function AssetCombobox({
  value,
  onValueChange,
  onBlur,
  className,
  optionFilter = () => true,
}: AssetComboboxProps) {
  const fetcher = useFetcher<ResultsPage<Asset>>();

  const preloadAssets = useCallback(() => {
    if (fetcher.state === "idle" && !fetcher.data) {
      fetcher.load("/api/proxy/assets?limit=10000");
    }
  }, [fetcher]);

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
      onMouseEnter={preloadAssets}
      searchValue={search}
      onSearchValueChange={setSearch}
      className={className}
      shouldFilter={false}
      showClear
    />
  );
}
