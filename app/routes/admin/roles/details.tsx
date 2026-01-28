import Fuse from "fuse.js";
import { Pencil } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useBeforeUnload, useBlocker, type UIMatch } from "react-router";
import { ApiFetcher } from "~/.server/api-utils";
import EditRoleButton from "~/components/admin/edit-role-button";
import HydrationSafeFormattedDate from "~/components/common/hydration-safe-formatted-date";
import DataList from "~/components/data-list";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { useModalFetcher } from "~/hooks/use-modal-fetcher";
import type { Capability, NotificationGroup, Role } from "~/lib/types";
import { buildTitleFromBreadcrumb, validateParam } from "~/lib/utils";
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

  const [role, capabilities, notificationGroups] = await Promise.all([
    ApiFetcher.create(request, "/roles/:id", { id }).get<Role>(),
    ApiFetcher.create(request, "/roles/capabilities").get<Capability[]>(),
    ApiFetcher.create(request, "/roles/notification-groups").get<NotificationGroup[]>(),
  ]);

  return {
    role,
    capabilities,
    notificationGroups,
  };
};

const SCOPE_LABELS: Record<Role["scope"], string> = {
  SYSTEM: "System",
  GLOBAL: "Global (All Clients)",
  CLIENT: "Client (All Sites)",
  SITE_GROUP: "Site Group",
  SITE: "Single Site",
  SELF: "Self Only",
};

export default function AdminRoleDetails({
  loaderData: { role, capabilities, notificationGroups },
}: Route.ComponentProps) {
  const [assignedNotificationGroups, setAssignedNotificationGroups] = useState<string[]>(
    role.notificationGroups
  );
  const [selectedCapabilities, setSelectedCapabilities] = useState<Set<string>>(
    new Set(role.capabilities)
  );
  const [search, setSearch] = useState("");

  useEffect(() => {
    setSearch("");
    setSelectedCapabilities(new Set(role.capabilities));
  }, [role]);

  useEffect(() => {
    setAssignedNotificationGroups(role.notificationGroups);
  }, [role]);

  const filteredCapabilities = useMemo(() => {
    if (!search) return capabilities;
    const fuse = new Fuse(capabilities, {
      keys: ["name", "label", "description"],
      threshold: 0.2,
    });
    return fuse.search(search).map((result) => result.item);
  }, [search, capabilities]);

  const isNotificationGroupsDirty =
    assignedNotificationGroups.length !== role.notificationGroups.length ||
    assignedNotificationGroups.some((id) => !role.notificationGroups.includes(id));

  const isCapabilitiesDirty =
    selectedCapabilities.size !== role.capabilities.length ||
    role.capabilities.some((cap) => !selectedCapabilities.has(cap));

  const { submitJson: submitNotificationGroups, isSubmitting: isSavingNotificationGroups } =
    useModalFetcher();
  const handleSaveNotificationGroups = () => {
    // Use the dedicated endpoint for notification groups
    submitNotificationGroups(
      { notificationGroupIds: assignedNotificationGroups },
      {
        method: "post",
        path: `/api/proxy/roles/${role.id}/update-notification-groups`,
      }
    );
  };

  const { submitJson: submitCapabilities, isSubmitting: isSavingCapabilities } = useModalFetcher();
  const handleSaveCapabilities = () => {
    // Include all role fields to prevent them from being reset
    submitCapabilities(
      {
        name: role.name,
        ...(role.description && { description: role.description }),
        scope: role.scope,
        clientAssignable: role.clientAssignable,
        capabilities: Array.from(selectedCapabilities),
        notificationGroups: assignedNotificationGroups,
      },
      {
        method: "patch",
        path: `/api/proxy/roles/${role.id}`,
      }
    );
  };

  const toggleCapability = (name: string) => {
    setSelectedCapabilities((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  const selectAllCapabilities = () => {
    setSelectedCapabilities(new Set(capabilities.map((c) => c.name)));
  };

  const deselectAllCapabilities = () => {
    setSelectedCapabilities(new Set());
  };

  const shouldBlock = useMemo(
    () => isCapabilitiesDirty || isNotificationGroupsDirty,
    [isCapabilitiesDirty, isNotificationGroupsDirty]
  );
  const blocker = useBlocker(shouldBlock);
  useBeforeUnload((e) => {
    if (shouldBlock) {
      e.preventDefault();
      e.returnValue = true;
    }
  });
  useEffect(() => {
    if (blocker.state === "blocked") {
      const confirmed = confirm("You have unsaved changes. Are you sure you want to leave?");
      if (confirmed) {
        blocker.proceed();
      }
    }
  }, [blocker]);

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
              {
                label: "Scope",
                value: SCOPE_LABELS[role.scope],
                help: "Controls how much data users with this role can see.",
              },
              {
                label: "Client Assignable",
                value: role.clientAssignable ? "Yes" : "No",
                help: "If true, client admins can assign this role to their own users.",
              },
            ]}
            defaultValue={<>&mdash;</>}
          />
          <DataList
            title="Other"
            details={[
              {
                label: "Created",
                value: <HydrationSafeFormattedDate date={role.createdOn} formatStr="PPpp" />,
              },
              {
                label: "Last Updated",
                value: <HydrationSafeFormattedDate date={role.updatedOn} formatStr="PPpp" />,
              },
            ]}
            defaultValue={<>&mdash;</>}
          />
        </CardContent>
      </Card>
      <Card>
        <div className="flex items-center justify-between gap-2">
          <CardHeader>
            <CardTitle>Notification Groups</CardTitle>
            <CardDescription>
              Users assigned to this role will receive notifications from each of the selected
              notification groups.
            </CardDescription>
          </CardHeader>
          <Button
            disabled={!isNotificationGroupsDirty || isSavingNotificationGroups}
            onClick={handleSaveNotificationGroups}
            className="mr-4 sm:mr-6"
          >
            {isSavingNotificationGroups ? "Saving..." : "Save Changes"}
          </Button>
        </div>
        <CardContent>
          <div className="grid gap-2">
            {notificationGroups.map((group) => (
              <div key={group.id} className="flex items-center gap-4">
                <Checkbox
                  id={`notification-group-${group.id}`}
                  checked={assignedNotificationGroups.includes(group.id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setAssignedNotificationGroups([...assignedNotificationGroups, group.id]);
                    } else {
                      setAssignedNotificationGroups(
                        assignedNotificationGroups.filter((id) => id !== group.id)
                      );
                    }
                  }}
                />
                <Label className="grid" htmlFor={`notification-group-${group.id}`}>
                  <div className="text-sm">{group.name}</div>
                  <div className="text-muted-foreground text-xs">{group.description}</div>
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Capabilities
            <Button
              disabled={!isCapabilitiesDirty || isSavingCapabilities}
              onClick={handleSaveCapabilities}
            >
              {isSavingCapabilities ? "Saving..." : "Save Changes"}
            </Button>
          </CardTitle>
          <CardDescription>
            Capabilities control what actions users with this role can perform.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex items-center gap-4">
            <Input
              placeholder="Search capabilities..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1"
            />
            <Button variant="outline" size="sm" onClick={selectAllCapabilities}>
              Select All
            </Button>
            <Button variant="outline" size="sm" onClick={deselectAllCapabilities}>
              Deselect All
            </Button>
          </div>
          <div className="grid gap-2">
            {filteredCapabilities.length > 0 ? (
              filteredCapabilities
                .sort((a, b) => a.label.localeCompare(b.label))
                .map((capability) => (
                  <div key={capability.name} className="flex items-center gap-4">
                    <Checkbox
                      id={`capability-${capability.name}`}
                      checked={selectedCapabilities.has(capability.name)}
                      onCheckedChange={() => toggleCapability(capability.name)}
                    />
                    <Label className="grid" htmlFor={`capability-${capability.name}`}>
                      <div className="text-sm">{capability.label}</div>
                      <div className="text-muted-foreground text-xs">{capability.description}</div>
                    </Label>
                  </div>
                ))
            ) : (
              <div className="flex flex-col items-center gap-4 py-6">
                No capabilities found.
                {search && (
                  <Button variant="outline" onClick={() => setSearch("")}>
                    Clear search
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
