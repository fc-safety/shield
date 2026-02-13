import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";
import type { DataOrError } from "~/.server/api-utils";
import { useModalFetcher } from "~/hooks/use-modal-fetcher";
import type { Capability, Role } from "~/lib/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";

const SCOPE_ORDER: Record<Role["scope"], number> = {
  SELF: 0,
  SITE: 1,
  SITE_GROUP: 2,
  CLIENT: 3,
  GLOBAL: 4,
  SYSTEM: 5,
};

const SCOPE_LABELS: Record<Role["scope"], string> = {
  SYSTEM: "System",
  GLOBAL: "Global (All Clients)",
  CLIENT: "Client (All Sites)",
  SITE_GROUP: "Site Group",
  SITE: "Single Site",
  SELF: "Self Only",
};

export default function RoleOverviewTable() {
  const [open, setOpen] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [capabilities, setCapabilities] = useState<Capability[]>([]);

  const {
    load: loadRoles,
    isLoading: isLoadingRoles,
    data: rolesData,
  } = useModalFetcher<DataOrError<Role[]>>({
    onData: (d) => setRoles(d.data ?? []),
  });

  const {
    load: loadCapabilities,
    isLoading: isLoadingCapabilities,
    data: capabilitiesData,
  } = useModalFetcher<DataOrError<Capability[]>>({
    onData: (d) => setCapabilities(d.data ?? []),
  });

  const isLoading = isLoadingRoles || isLoadingCapabilities;

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      if (!rolesData) loadRoles({ path: "/api/proxy/roles" });
      if (!capabilitiesData) loadCapabilities({ path: "/api/proxy/roles/capabilities" });
    }
  };

  // Filter to non-global/system roles, sort by scope asc then capabilities count asc
  const sortedRoles = useMemo(
    () =>
      roles
        .filter((r) => r.scope !== "GLOBAL" && r.scope !== "SYSTEM")
        .sort((a, b) => {
          const scopeDiff = SCOPE_ORDER[a.scope] - SCOPE_ORDER[b.scope];
          if (scopeDiff !== 0) return scopeDiff;
          return a.capabilities.length - b.capabilities.length;
        }),
    [roles]
  );

  // Union of all capabilities across filtered roles, ordered by capabilities list
  const allCapabilityNames = useMemo(() => {
    const set = new Set<string>();
    for (const role of sortedRoles) {
      for (const cap of role.capabilities) set.add(cap);
    }
    // Preserve the order from the capabilities endpoint
    if (capabilities.length > 0) {
      return capabilities.filter((c) => set.has(c.name));
    }
    return [...set].map((name) => ({ name, label: name, description: "" }));
  }, [sortedRoles, capabilities]);

  return (
    <div>
      <Button
        variant="ghost"
        size="sm"
        className="text-muted-foreground gap-1.5 px-0 pr-1"
        onClick={() => handleOpenChange(!open)}
      >
        <motion.span
          animate={{ rotate: open ? 0 : -90 }}
          transition={{ duration: 0.2 }}
          className="inline-flex"
        >
          <ChevronDown className="h-4 w-4" />
        </motion.span>
        What does each role do?
      </Button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            {isLoading ? (
              <p className="text-muted-foreground py-3 text-sm">Loading roles...</p>
            ) : sortedRoles.length === 0 ? (
              <p className="text-muted-foreground py-3 text-sm">No roles available.</p>
            ) : (
              <div className="mt-2 overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="bg-card text-card-foreground sticky left-0 z-10" />
                      {sortedRoles.map((role) => (
                        <TableHead key={role.id} className="text-center whitespace-nowrap">
                          {role.name}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* Scope row */}
                    <TableRow>
                      <TableCell className="bg-card text-card-foreground sticky left-0 z-10 text-xs font-medium">
                        Scope
                      </TableCell>
                      {sortedRoles.map((role) => (
                        <TableCell
                          key={role.id}
                          className="bg-card/30 text-card-foreground text-center text-xs whitespace-nowrap"
                        >
                          {SCOPE_LABELS[role.scope]}
                        </TableCell>
                      ))}
                    </TableRow>

                    {/* Capability rows */}
                    {allCapabilityNames.map((cap) => (
                      <TableRow key={cap.name}>
                        <TableCell
                          className="bg-card text-card-foreground sticky left-0 z-10 text-xs"
                          title={cap.description}
                        >
                          {cap.label}
                        </TableCell>
                        {sortedRoles.map((role) => (
                          <TableCell key={role.id} className="text-center">
                            {role.capabilities.includes(cap.name) && (
                              <Check className="text-primary mx-auto h-4 w-4" />
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
