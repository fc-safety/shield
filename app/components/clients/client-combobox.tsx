import Fuse from "fuse.js";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useFetcher } from "react-router";
import type { Client, ResultsPage } from "~/lib/models";
import { ResponsiveCombobox } from "../responsive-combobox";

interface ClientComboboxProps {
  value?: string | undefined;
  onValueChange?: (value: string | undefined) => void;
  onBlur?: () => void;
  className?: string;
}

const fuse = new Fuse([] as Client[], { keys: ["name"] });

export default function ClientCombobox({
  value,
  onValueChange,
  onBlur,
  className,
}: ClientComboboxProps) {
  const fetcher = useFetcher<ResultsPage<Client>>();

  const preloadClients = useCallback(() => {
    if (fetcher.state === "idle" && !fetcher.data) {
      fetcher.load("/api/proxy/clients?limit=10000");
    }
  }, [fetcher]);

  useEffect(() => {
    if (value) preloadClients();
  }, [value, preloadClients]);

  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (fetcher.data) {
      setClients(fetcher.data.results);
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

  return (
    <ResponsiveCombobox
      value={value}
      onValueChange={onValueChange}
      onBlur={onBlur}
      displayValue={(value) =>
        clients.find((c) => c.id === value)?.name ?? <>&mdash;</>
      }
      loading={fetcher.state === "loading"}
      options={options}
      onMouseEnter={preloadClients}
      searchValue={search}
      onSearchValueChange={setSearch}
      className={className}
      shouldFilter={false}
      showClear
    />
  );
}
