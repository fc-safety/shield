import Fuse from "fuse.js";
import { ShieldAlert } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { DataOrError } from "~/.server/api-utils";
import { useModalFetcher } from "~/hooks/use-modal-fetcher";
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
  excludeRoles?: string[]; // Filter out these role IDs from the options
}

const fuse = new Fuse([] as Role[], {
  keys: ["name", "description", "friendlyName"],
});

function RoleOption({ role, isElevated = false }: { role: Role; isElevated?: boolean }) {
  return (
    <div className="flex gap-1.5">
      {isElevated && <ShieldAlert className="mt-0.5 size-2.5 shrink-0" />}
      <div className="flex flex-col gap-1">
        <span>{role.name}</span>
        <span className="text-muted-foreground text-xs">{role.description}</span>
      </div>
    </div>
  );
}

export default function RoleCombobox({
  value: valueProp,
  onValueChange,
  onBlur,
  className,
  defaultByName,
  showClear = false,
  disabled,
  onRoleChange,
  excludeRoles = [],
}: RoleComboboxProps) {
  const [roles, setRoles] = useState<Role[]>([]);
  const {
    load,
    isLoading,
    data: rolesData,
  } = useModalFetcher<DataOrError<Role[]>>({
    onData: (d) => setRoles(d.data ?? []),
  });

  const preloadRoles = useCallback(() => {
    if (rolesData) return;
    load({ path: "/api/proxy/roles" });
  }, [load, rolesData]);

  useEffect(() => {
    if (valueProp || defaultByName) preloadRoles();
  }, [valueProp, defaultByName, preloadRoles]);

  const [search, setSearch] = useState("");

  const options = useMemo(() => {
    let filteredRoles = roles;

    // Filter out excluded roles
    if (excludeRoles.length > 0) {
      filteredRoles = filteredRoles.filter((role) => !excludeRoles.includes(role.id));
    }

    if (search) {
      fuse.setCollection(filteredRoles);
      filteredRoles = fuse.search(search).map((result) => result.item);
    }

    const isElevatedRole = (role: Role) => role.scope === "GLOBAL" || role.scope === "SYSTEM";

    const standardRoles = filteredRoles.filter((r) => !isElevatedRole(r));
    const elevatedRoles = filteredRoles.filter((r) => isElevatedRole(r));

    // If there are no elevated roles, return a flat list
    if (elevatedRoles.length === 0) {
      return standardRoles.map((role) => ({
        label: <RoleOption role={role} />,
        value: role.id,
      }));
    }

    // Return grouped options with elevated roles separated
    const groups = [];
    if (standardRoles.length > 0) {
      groups.push({
        key: "standard",
        groupLabel: "Client Roles",
        options: standardRoles.map((role) => ({
          label: <RoleOption role={role} />,
          value: role.id,
        })),
      });
    }
    groups.push({
      key: "elevated",
      groupLabel: "Global Roles",
      options: elevatedRoles.map((role) => ({
        label: <RoleOption role={role} isElevated />,
        value: role.id,
      })),
    });

    return groups;
  }, [roles, search, excludeRoles]);

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
      displayValue={(value) => roles.find((c) => c.id === value)?.name ?? <>&mdash;</>}
      loading={isLoading}
      options={options}
      disabled={disabled}
      onMouseOver={() => !disabled && preloadRoles()}
      onTouchStart={() => !disabled && preloadRoles()}
      onKeyDown={(e) => {
        if (e.key === "Enter" && !disabled) {
          preloadRoles();
        }
      }}
      searchValue={search}
      onSearchValueChange={setSearch}
      className={className}
      shouldFilter={false}
      showClear={showClear}
    />
  );
}
