import Fuse from "fuse.js";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useFetcher } from "react-router";
import type { Role } from "~/lib/types";
import { ResponsiveCombobox } from "../responsive-combobox";

interface RoleComboboxProps {
  value?: string | undefined;
  onValueChange?: (value: string | undefined) => void;
  onBlur?: () => void;
  className?: string;
  defaultByName?: string;
  showClear?: boolean;
  disabled?: boolean;
  onRoleChange?: (role: Role | undefined) => void;
}

const fuse = new Fuse([] as Role[], {
  keys: ["name", "description", "friendlyName"],
});

export default function RoleCombobox({
  value: valueProp,
  onValueChange,
  onBlur,
  className,
  defaultByName,
  showClear = false,
  disabled,
  onRoleChange,
}: RoleComboboxProps) {
  const fetcher = useFetcher<Role[]>();

  const preloadRoles = useCallback(() => {
    if (fetcher.state === "idle" && !fetcher.data) {
      fetcher.load("/api/proxy/roles");
    }
  }, [fetcher]);

  useEffect(() => {
    if (valueProp || defaultByName) preloadRoles();
  }, [valueProp, defaultByName, preloadRoles]);

  const [roles, setRoles] = useState<Role[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (fetcher.data) {
      setRoles(fetcher.data);
    }
  }, [fetcher.data]);

  const options = useMemo(() => {
    let filteredRoles = roles;
    if (search) {
      fuse.setCollection(roles);
      filteredRoles = fuse.search(search).map((result) => result.item);
    }
    return filteredRoles.map((role) => ({
      label: role.name,
      value: role.id,
    }));
  }, [roles, search]);

  const value = useMemo(() => {
    if (valueProp) {
      return valueProp;
    }

    if (defaultByName) {
      const role = roles.find((c) => c.name === defaultByName);
      if (role) {
        return role.id;
      }
    }

    return "";
  }, [valueProp, defaultByName, roles]);

  useEffect(() => {
    onRoleChange?.(roles.find((r) => value && r.id === value));
  }, [value, roles, onRoleChange]);

  return (
    <ResponsiveCombobox
      value={value}
      onValueChange={onValueChange}
      onBlur={onBlur}
      displayValue={(value) =>
        roles.find((c) => c.id === value)?.name ?? <>&mdash;</>
      }
      loading={fetcher.state === "loading"}
      options={options}
      disabled={disabled}
      onMouseOver={() => !disabled && preloadRoles()}
      onTouchStart={() => !disabled && preloadRoles()}
      searchValue={search}
      onSearchValueChange={setSearch}
      className={className}
      shouldFilter={false}
      showClear={showClear}
    />
  );
}
