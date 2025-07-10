import { Link, useMatches } from "react-router";
import { useOptimizedImageUrls } from "~/contexts/optimized-image-context";
import { cn, validateBreadcrumb } from "~/lib/utils";
import { BreadcrumbResponsive } from "./breadcrumb-responsive";
import { ModeToggle } from "./mode-toggle";

export default function Header({
  leftSlot,
  rightSlot,
  homeTo = "/",
  showBreadcrumb = true,
  showBannerLogo = true,
  className,
}: {
  leftSlot?: React.ReactNode;
  rightSlot?: React.ReactNode;
  homeTo?: string;
  showBreadcrumb?: boolean;
  showBannerLogo?: boolean;
  className?: string;
}) {
  const matches = useMatches();

  const {
    bannerLogoDark: { h24px: bannerLogoDarkUrl },
    bannerLogoLight: { h24px: bannerLogoLightUrl },
  } = useOptimizedImageUrls();

  return (
    <header
      className={cn(
        "flex flex-col shrink-0 gap-y-1 pt-4 px-2 sm:px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:pt-2",
        className
      )}
    >
      <div className="flex items-center gap-x-2">
        {leftSlot}
        {showBannerLogo && (
          <Link to={homeTo}>
            <img
              src={bannerLogoLightUrl}
              alt=""
              className="h-5 w-auto object-contain dark:hidden"
            />
            <img
              src={bannerLogoDarkUrl}
              alt=""
              className="h-5 w-auto object-contain hidden dark:block"
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
              label: "Home",
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
