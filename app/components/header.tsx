import { Home } from "lucide-react";
import { useMatches } from "react-router";
import { validateBreadcrumb } from "~/lib/utils";
import { BreadcrumbResponsive } from "./breadcrumb-responsive";
import { ModeToggle } from "./mode-toggle";

export default function Header({
  leftSlot,
  rightSlot,
  homeTo = "/",
}: {
  leftSlot?: React.ReactNode;
  rightSlot?: React.ReactNode;
  homeTo?: string;
}) {
  const matches = useMatches();

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <div className="flex items-center gap-2 px-2 sm:px-4">
        {leftSlot}
        <BreadcrumbResponsive
          items={[
            {
              to: homeTo,
              label: <Home size={16} />,
              id: "home",
            },
            ...matches.filter(validateBreadcrumb).map((match) => ({
              id: match.id,
              label: match.handle.breadcrumb(match).label,
              to: match.pathname,
            })),
          ]}
        />
      </div>
      <div className="flex-1" />
      <div className="flex items-center gap-2 px-2 sm:px-4">
        {rightSlot}
        <ModeToggle />
      </div>
    </header>
  );
}
