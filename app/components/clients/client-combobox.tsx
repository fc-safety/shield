import Fuse from "fuse.js";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { DataOrError } from "~/.server/api-utils";
import { useAccessIntent } from "~/contexts/requested-access-context";
import { useModalFetcher } from "~/hooks/use-modal-fetcher";
import type { Client, ResultsPage } from "~/lib/models";
import { type QueryParams } from "~/lib/urls";
import { ResponsiveCombobox } from "../responsive-combobox";

interface ClientComboboxProps {
  value?: string | undefined;
  onValueChange?: (value: string | undefined) => void;
  onBlur?: () => void;
  className?: string;
  disabled?: boolean;
  showClear?: boolean;
  nestDrawers?: boolean;
}

const fuse = new Fuse([] as Client[], { keys: ["name"] });

export default function ClientCombobox({
  value,
  onValueChange,
  onBlur,
  className,
  disabled,
  showClear,
  nestDrawers,
}: ClientComboboxProps) {
  const accessIntent = useAccessIntent();

  const [clients, setClients] = useState<Client[]>([]);
  const {
    load,
    isLoading,
    data: fetcherData,
  } = useModalFetcher<DataOrError<ResultsPage<Client>>>({
    onData: ({ data }) => setClients(data?.results ?? []),
  });

  const preloadClients = useCallback(() => {
    const query: QueryParams = {
      limit: 10000,
      _throw: "false",
    };
    load({
      path: "/api/proxy/clients",
      query,
    });
  }, [load]);

  useEffect(() => {
    if (value || accessIntent !== "system") preloadClients();
  }, [value, accessIntent, preloadClients]);

  const [search, setSearch] = useState("");

  const options = useMemo(() => {
    let filteredClients = clients;
    if (search) {
      fuse.setCollection(clients);
      filteredClients = fuse.search(search).map((result) => result.item);
    }
    return filteredClients.map((c) => ({
      label: c.name,
      value: c.id,
    }));
  }, [clients, search]);

  useEffect(() => {
    if (!value && accessIntent !== "system" && clients.length > 0) {
      onValueChange?.(clients[0].id);
    }
  }, [value, accessIntent, clients, onValueChange]);

  return (
    <ResponsiveCombobox
      value={value}
      onValueChange={onValueChange}
      onBlur={onBlur}
      displayValue={(value) => clients.find((c) => c.id === value)?.name ?? <>&mdash;</>}
      loading={isLoading}
      options={options}
      disabled={disabled}
      onMouseOver={() => !disabled && preloadClients()}
      onTouchStart={() => !disabled && preloadClients()}
      onKeyDown={(e) => {
        if (e.key === "Enter" && !disabled) {
          preloadClients();
        }
      }}
      searchValue={search}
      onSearchValueChange={setSearch}
      className={className}
      shouldFilter={false}
      showClear={showClear}
      errorMessage={fetcherData?.error ? "Something went wrong." : undefined}
      isNestedDrawer={nestDrawers}
    />
  );
}
