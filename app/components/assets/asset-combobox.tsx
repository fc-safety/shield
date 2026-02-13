import Fuse from "fuse.js";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { DataOrError } from "~/.server/api-utils";
import { useAuth } from "~/contexts/auth-context";
import { useModalFetcher } from "~/hooks/use-modal-fetcher";
import { useOpenData } from "~/hooks/use-open-data";
import type { Asset, ResultsPage } from "~/lib/models";
import { CAPABILITIES } from "~/lib/permissions";
import { type QueryParams } from "~/lib/urls";
import { can } from "~/lib/users";
import { ResponsiveCombobox } from "../responsive-combobox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import CreateAssetButton from "./create-asset-assistant/create-asset-button";

interface AssetComboboxProps {
  value?: string | undefined;
  onValueChange?: (value: string | undefined) => void;
  onBlur?: () => void;
  className?: string;
  optionFilter?: (asset: Asset) => boolean;
  optionQueryFilter?: QueryParams;
  disabled?: boolean;
  clientId?: string;
  siteId?: string;
  showClear?: boolean;
  nestDrawers?: boolean;
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
  clientId,
  siteId,
  showClear,
  nestDrawers,
}: AssetComboboxProps) {
  const { user } = useAuth();

  const [assets, setAssets] = useState<Asset[]>([]);
  const {
    load,
    isLoading,
    data: fetcherData,
  } = useModalFetcher<DataOrError<ResultsPage<Asset>>>({
    onData: (data) => {
      setAssets(data.data?.results ?? []);
    },
  });

  const canCreate = useMemo(() => can(user, CAPABILITIES.MANAGE_ASSETS), [user]);

  const createNew = useOpenData();

  const preloadAssets = useCallback(() => {
    load({
      path: "/api/proxy/assets",
      query: {
        limit: 10000,
        ...optionQueryFilter,
      },
    });
  }, [load, optionQueryFilter]);

  useEffect(() => {
    if (!fetcherData && value) preloadAssets();
  }, [value, preloadAssets, fetcherData]);

  const [search, setSearch] = useState("");

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
    <>
      <ResponsiveCombobox
        value={value}
        onValueChange={onValueChange}
        onBlur={onBlur}
        displayValue={(value) => {
          const asset = assets.find((asset) => asset.id === value);
          if (asset) {
            return asset.name || asset.product?.name || <>&mdash;</>;
          }
          return <>&mdash;</>;
        }}
        loading={isLoading}
        options={options}
        onMouseOver={() => !disabled && preloadAssets()}
        onTouchStart={() => !disabled && preloadAssets()}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !disabled) {
            preloadAssets();
          }
        }}
        searchValue={search}
        onSearchValueChange={setSearch}
        className={className}
        shouldFilter={false}
        disabled={disabled}
        showClear={showClear}
        onCreate={() => createNew.openNew()}
        isNestedDrawer={nestDrawers}
      />
      {canCreate ? (
        <CreateAssetButton
          trigger={null}
          open={createNew.open}
          onOpenChange={(openState) => {
            createNew.setOpen(openState);
            if (!openState) {
              preloadAssets();
            }
          }}
          clientId={clientId}
          siteId={siteId}
          nestDrawers
          dialogClassName="z-51"
        />
      ) : (
        <Dialog open={createNew.open} onOpenChange={createNew.setOpen}>
          <DialogContent className="z-51">
            <DialogHeader>
              <DialogTitle>Permission Required</DialogTitle>
            </DialogHeader>
            <DialogDescription>
              You do not have permission to create assets. Please contact your administrator.
            </DialogDescription>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
