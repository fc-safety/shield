import { Home } from "lucide-react";
import { Link, useMatches } from "react-router";
import { BANNER_LOGO_DARK_URL, BANNER_LOGO_LIGHT_URL } from "~/lib/constants";
import { validateBreadcrumb } from "~/lib/utils";
import { BreadcrumbResponsive } from "./breadcrumb-responsive";
import { ModeToggle } from "./mode-toggle";

export default function Header({
  leftSlot,
  rightSlot,
  homeTo = "/",
  showBreadcrumb = true,
  showBannerLogo = true,
}: {
  leftSlot?: React.ReactNode;
  rightSlot?: React.ReactNode;
  homeTo?: string;
  showBreadcrumb?: boolean;
  showBannerLogo?: boolean;
}) {
  const matches = useMatches();

  return (
    <header className="flex flex-col shrink-0 gap-2 py-4 px-2 sm:px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:py-2">
      <div className="flex items-center gap-x-2">
        {leftSlot}
        {showBannerLogo && (
          <Link to={homeTo}>
            <img
              src={BANNER_LOGO_LIGHT_URL}
              alt=""
              className="h-4 w-auto object-contain dark:hidden"
            />
            <img
              src={BANNER_LOGO_DARK_URL}
              alt=""
              className="h-4 w-auto object-contain hidden dark:block"
            />
          </Link>
        )}
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          {rightSlot}
          <ModeToggle />
        </div>
      </div>
      {showBreadcrumb && (
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
      )}
    </header>
  );
}
