import type { CheckedState } from "@radix-ui/react-checkbox";
import { format } from "date-fns";
import Fuse from "fuse.js";
import { MinusSquare, Pencil, PlusSquare } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useFetcher, type UIMatch } from "react-router";
import type { z } from "zod";
import { create } from "zustand";
import {
  authenticatedData,
  defaultDataGetter,
  FetchOptions,
} from "~/.server/api-utils";
import EditRoleButton from "~/components/admin/edit-role-button";
import DataList from "~/components/data-list";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { type updatePermissionMappingSchema } from "~/lib/schema";
import type {
  GetPermissionsResponse,
  Permission,
  PermissionsGroup,
  Role,
} from "~/lib/types";
import { buildTitleFromBreadcrumb, cn, validateParam } from "~/lib/utils";
import type { Route } from "./+types/details";

export const handle = {
  breadcrumb: ({ data }: Route.MetaArgs | UIMatch<Route.MetaArgs["data"]>) => ({
    label: data?.role.name || "Details",
  }),
};

export const meta: Route.MetaFunction = ({ matches }) => {
  return [{ title: buildTitleFromBreadcrumb(matches) }];
};

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const id = validateParam(params, "id");

  return authenticatedData<{
    role: Role;
    permissions: GetPermissionsResponse;
  }>(
    request,
    [
      FetchOptions.url("/roles/:id", { id }).get().build(),
      FetchOptions.url("/roles/permissions").get().build(),
    ],
    async ([rolesResponse, permissionsResponse]) => ({
      role: await defaultDataGetter([rolesResponse]),
      permissions: await defaultDataGetter([permissionsResponse]),
    })
  );
};

const usePermissionsStore = create<{
  search: string;
  setSearch: (search: string) => void;
  selection: Set<string>;
  setSelection: (selection: Iterable<string>) => void;
  toggle: (name: string) => void;
  selectMany: (names: string[]) => void;
  deselectMany: (names: string[]) => void;
}>((set) => ({
  search: "",
  setSearch: (search: string) => set({ search }),
  selection: new Set(),
  setSelection: (selection: Iterable<string>) =>
    set({ selection: new Set(selection) }),
  toggle: (name: string) => {
    set((state) => {
      if (state.selection.has(name)) state.selection.delete(name);
      else state.selection.add(name);
      return { selection: state.selection };
    });
  },
  selectMany: (names: string[]) => {
    set((state) => {
      return { selection: new Set([...state.selection, ...names]) };
    });
  },
  deselectMany: (names: string[]) => {
    set((state) => {
      return {
        selection: new Set(
          [...state.selection].filter((id) => !names.includes(id))
        ),
      };
    });
  },
}));

export default function AdminRoleDetails({
  loaderData: {
    role,
    permissions: { permissions, permissionsFlat },
  },
}: Route.ComponentProps) {
  const { search, setSearch, selection, setSelection } = usePermissionsStore();
  const permissionsFetcher = useFetcher();

  useEffect(() => {
    setSearch("");
    setSelection(role.permissions);
  }, [role, setSelection, setSearch]);

  const permissionGroupComponents = Object.values(permissions).map((group) => (
    <PermissionsGroup key={group.title} permissionsGroup={group} />
  ));

  const emptyResults = useMemo(
    () => !!search && filterPermissions(search, permissionsFlat).length === 0,
    [search, permissionsFlat]
  );

  const isPermissionsDirty =
    role.permissions.length < selection.size ||
    role.permissions.some((id) => !selection.has(id));

  const handleSavePermissions = () => {
    const alreadyGrantedSet = new Set(role.permissions);

    const updatePermissionsMapping: z.infer<
      typeof updatePermissionMappingSchema
    > = {
      grant: [],
      revoke: [],
    };

    for (const p of permissionsFlat) {
      if (selection.has(p.name) && !alreadyGrantedSet.has(p.name)) {
        updatePermissionsMapping.grant.push(p);
      } else if (!selection.has(p.name) && alreadyGrantedSet.has(p.name)) {
        updatePermissionsMapping.revoke.push(p);
      }
    }

    permissionsFetcher.submit(updatePermissionsMapping, {
      method: "post",
      action: `/api/proxy/roles/${role.id}/update-permissions`,
      encType: "application/json",
    });
  };

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle>
            <div className="inline-flex items-center gap-4">
              Role Details
              <div className="flex gap-2">
                <EditRoleButton
                  role={role}
                  trigger={
                    <Button variant="secondary" size="icon" type="button">
                      <Pencil />
                    </Button>
                  }
                />
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-8">
          <DataList
            details={[
              { label: "Name", value: role.name },
              {
                label: "Description",
                value: role.description,
              },
            ]}
            defaultValue={<>&mdash;</>}
          />
          <DataList
            title="Other"
            details={[
              { label: "Created ", value: format(role.createdOn, "PPpp") },
              {
                label: "Last Updated",
                value: format(role.updatedOn, "PPpp"),
              },
            ]}
            defaultValue={<>&mdash;</>}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Permissions
            <Button
              disabled={
                !isPermissionsDirty || permissionsFetcher.state === "submitting"
              }
              onClick={handleSavePermissions}
            >
              {permissionsFetcher.state === "submitting"
                ? "Saving..."
                : "Save Changes"}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Input
            placeholder="Search permissions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="grid gap-2">
            {permissionGroupComponents}
            {!!search && emptyResults && (
              <div className="py-6 flex flex-col items-center gap-4">
                No permissions found.
                <Button variant="outline" onClick={() => setSearch("")}>
                  Clear search
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PermissionsGroup({
  permissionsGroup,
}: {
  permissionsGroup: PermissionsGroup;
}) {
  const [open, setOpen] = useState(false);
  const { search, selectMany, deselectMany, toggle, selection } =
    usePermissionsStore();

  const allChildPermissions = useMemo(() => {
    const extractPermissions = (group: PermissionsGroup) => {
      const childPermissions: Permission[] = [];
      if (group.permissions) childPermissions.push(...group.permissions);
      if (group.children) {
        group.children.forEach((child) => {
          childPermissions.push(...extractPermissions(child));
        });
      }
      return childPermissions;
    };

    return extractPermissions(permissionsGroup);
  }, [permissionsGroup]);

  const allChildPermissionsNames = useMemo(() => {
    return allChildPermissions.map((p) => p.name);
  }, [allChildPermissions]);

  const emptyResults = useMemo(
    () =>
      !!search && filterPermissions(search, allChildPermissions).length === 0,
    [search, allChildPermissions]
  );

  const filteredPermissions = useMemo(() => {
    return (
      permissionsGroup.permissions &&
      filterPermissions(search, permissionsGroup.permissions)
    );
  }, [permissionsGroup.permissions, search]);

  const checkedState = getCheckedStateForPermissions(
    selection,
    allChildPermissionsNames
  );

  useEffect(() => {
    setOpen(!!search || !!checkedState);
  }, [search, checkedState]);

  useEffect(() => {
    if (permissionsGroup.defaultName) {
      selectMany([permissionsGroup.defaultName]);
    }
  }, [permissionsGroup.defaultName, selectMany]);

  return (
    !emptyResults && (
      <Collapsible open={open} onOpenChange={setOpen}>
        <div className="flex items-center gap-2">
          <span className="capitalize">{permissionsGroup.title}</span>
          <div className="flex-1"></div>
          {permissionsGroup.many && (
            <Checkbox
              checked={checkedState}
              onCheckedChange={(checked) =>
                checked
                  ? selectMany(allChildPermissionsNames)
                  : deselectMany(allChildPermissionsNames)
              }
            />
          )}
          <CollapsibleTrigger className="relative size-5">
            <PlusSquare
              className={cn(
                "absolute inset-0 size-5 transition-opacity",
                open ? "opacity-0" : "opacity-100"
              )}
            />
            <MinusSquare
              className={cn(
                "absolute inset-0 size-5 transition-opacity",
                open ? "opacity-100" : "opacity-0"
              )}
            />
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent>
          <div className="grid gap-2 px-4 py-2">
            {permissionsGroup.children ? (
              permissionsGroup.children.map((child) => (
                <PermissionsGroup key={child.title} permissionsGroup={child} />
              ))
            ) : filteredPermissions ? (
              <DisplayPermissions
                many={permissionsGroup.many}
                permissions={filteredPermissions}
                onCheckedToggle={(name, checked) => {
                  if (!permissionsGroup.many) {
                    if (checked) {
                      deselectMany(allChildPermissionsNames);
                      selectMany([name]);
                    }
                  } else {
                    toggle(name);
                  }
                }}
              />
            ) : null}
          </div>
        </CollapsibleContent>
      </Collapsible>
    )
  );
}

function DisplayPermissions({
  permissions,
  onCheckedToggle,
  many,
}: {
  permissions: Permission[];
  onCheckedToggle?: (name: string, checked: CheckedState) => void;
  many?: boolean;
}) {
  const { selection } = usePermissionsStore();
  const label = (permission: Permission) => (
    <Label className="grid" htmlFor={`permission-${permission.id}`}>
      <div className="text-sm">{permission.friendlyName}</div>
      <div className="text-xs text-muted-foreground">
        {permission.description}
      </div>
    </Label>
  );

  const sortedPermissions = permissions.sort((a, b) =>
    a.friendlyName.localeCompare(b.friendlyName)
  );

  return many ? (
    <div className="grid gap-2">
      {sortedPermissions.map((permission) => (
        <div key={permission.id} className="flex items-center gap-4">
          <Checkbox
            id={`permission-${permission.id}`}
            checked={selection.has(permission.name)}
            onCheckedChange={(checked) =>
              onCheckedToggle?.(permission.name, checked)
            }
          />
          {label(permission)}
        </div>
      ))}
    </div>
  ) : (
    <RadioGroup
      className="grid gap-2"
      onValueChange={(name) => onCheckedToggle?.(name, true)}
      value={permissions.find((p) => selection.has(p.name))?.name}
    >
      {sortedPermissions.map((permission) => (
        <div key={permission.id} className="flex items-center gap-4">
          <RadioGroupItem
            value={permission.name}
            id={`permission-${permission.id}`}
          ></RadioGroupItem>
          {label(permission)}
        </div>
      ))}
    </RadioGroup>
  );
}

const filterPermissions = (search: string, permissions: Permission[]) => {
  if (!search) return permissions;
  const fuse = new Fuse(permissions, {
    keys: ["name", "friendlyName", "description"],
    threshold: 0.2,
  });
  return fuse.search(search).map((result) => result.item);
};

const getCheckedStateForPermissions = (
  selection: Set<string>,
  permissionNames: string[]
) => {
  if (permissionNames.every((pName) => selection.has(pName))) return true;
  if (permissionNames.some((pName) => selection.has(pName)))
    return "indeterminate";
  return false;
};
