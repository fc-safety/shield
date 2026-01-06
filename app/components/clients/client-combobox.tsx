import Fuse from "fuse.js";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useFetcher } from "react-router";
import type { DataOrError } from "~/.server/api-utils";
import { useViewContext } from "~/contexts/view-context";
import type { Client, ResultsPage } from "~/lib/models";
import { buildPath, type QueryParams } from "~/lib/urls";
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
  const viewContext = useViewContext();
  const fetcher = useFetcher<DataOrError<ResultsPage<Client>>>();

  const preloadClients = useCallback(() => {
    if (fetcher.state === "idle" && !fetcher.data) {
      const query: QueryParams = {
        limit: 10000,
        _throw: "false",
      };
      if (viewContext) {
        query._viewContext = viewContext;
      }
      fetcher.load(buildPath("/api/proxy/clients", query));
    }
  }, [fetcher, viewContext]);

  useEffect(() => {
    if (value || viewContext !== "admin") preloadClients();
  }, [value, viewContext, preloadClients]);

  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (fetcher.data?.data) {
      setClients(fetcher.data.data.results);
    } else if (fetcher.data?.error) {
      console.error("Failed to fetch clients", fetcher.data.error);
      setHasError(true);
    }
  }, [fetcher.data]);

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
    if (!value && viewContext !== "admin" && clients.length > 0) {
      onValueChange?.(clients[0].id);
    }
  }, [value, viewContext, clients, onValueChange]);

  return (
    <ResponsiveCombobox
      value={value}
      onValueChange={onValueChange}
      onBlur={onBlur}
      displayValue={(value) => clients.find((c) => c.id === value)?.name ?? <>&mdash;</>}
      loading={fetcher.state === "loading"}
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
      errorMessage={hasError ? "Something went wrong." : undefined}
      isNestedDrawer={nestDrawers}
    />
  );
}
