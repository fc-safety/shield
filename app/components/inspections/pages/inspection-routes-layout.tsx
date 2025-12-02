import { ChevronRight, RouteIcon } from "lucide-react";
import { NavLink, Outlet, type To } from "react-router";
import { Fragment } from "react/jsx-runtime";
import HelpPopover from "~/components/help-popover";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import { useAuth } from "~/contexts/auth-context";
import type { InspectionRoute } from "~/lib/models";
import { can } from "~/lib/users";
import { cn } from "~/lib/utils";
import EditRouteButton from "../edit-route-button";

export default function InspectionRoutesLayout({
  routes,
  buildDetailsTo,
}: {
  routes: InspectionRoute[];
  buildDetailsTo: (id: string) => To;
}) {
  const { user } = useAuth();
  const canCreate = can(user, "create", "inspection-routes");

  return (
    <div className="@container flex flex-col gap-4">
      <div className="grid w-full grid-cols-1 gap-2 @4xl:grid-cols-[325px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>
              <RouteIcon />
              Inspection Routes
              <HelpPopover>
                {canCreate ? (
                  <>
                    Build routes to help your inspectors find your assets and ensure inspections get
                    completed if the task gets picked up again on a different day or even by a
                    different inspector.
                  </>
                ) : (
                  <>
                    Routes are used to help inspectors find assets and ensure inspections get
                    completed if the task gets picked up again on a different day or even by a
                    different inspector.
                  </>
                )}
              </HelpPopover>
            </CardTitle>
            <CardDescription>Select an inspection route to view its details.</CardDescription>
            {canCreate && <EditRouteButton />}
          </CardHeader>
          <CardContent className="flex flex-1 flex-col items-stretch">
            {routes.map((route, idx) => (
              <Fragment key={route.id}>
                {idx > 0 && <Separator />}
                <NavLink
                  to={buildDetailsTo(route.id)}
                  className={({ isActive }) =>
                    cn(
                      "group -mx-3 flex cursor-pointer items-center gap-x-2 rounded-md px-3 py-2.5",
                      isActive && "bg-accent"
                    )
                  }
                >
                  <div className="flex-1">
                    <h3 className="text-sm font-medium">{route.name}</h3>
                    <p className="text-muted-foreground text-xs">
                      {route.description || <span className="italic">No description.</span>}
                    </p>
                  </div>
                  <ChevronRight className="text-muted-foreground group-hover:text-primary size-5 transition-all group-hover:translate-x-1" />
                </NavLink>
              </Fragment>
            ))}
          </CardContent>
        </Card>
        <Outlet />
      </div>
    </div>
  );
}
