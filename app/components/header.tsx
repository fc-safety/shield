import type { ComponentProps } from "react";
import { Link, useMatches } from "react-router";
import { useOptimizedImageUrls } from "~/contexts/optimized-image-context";
import { cn, validateBreadcrumb } from "~/lib/utils";
import { BreadcrumbResponsive } from "./breadcrumb-responsive";
import { ModeToggle } from "./mode-toggle";
import { Separator } from "./ui/separator";
import { UserDropdownMenu } from "./user-dropdown-menu";

export default function Header({
  leftSlot,
  rightSlot,
  homeTo = "/",
  showBreadcrumb = true,
  showBannerLogo = true,
  className,
  user,
  userRoutes,
  logoutReturnTo,
}: {
  leftSlot?: React.ReactNode;
  rightSlot?: React.ReactNode;
  homeTo?: string;
  showBreadcrumb?: boolean;
  showBannerLogo?: boolean;
  className?: string;
} & Partial<ComponentProps<typeof UserDropdownMenu>>) {
  const matches = useMatches();

  const {
    bannerLogoDark: { h48px: bannerLogoDarkUrl },
    bannerLogoLight: { h48px: bannerLogoLightUrl },
  } = useOptimizedImageUrls();

  return (
    <header
      className={cn(
        "flex shrink-0 flex-col gap-y-1 px-2 pt-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:pt-2 sm:px-4",
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
              className="h-4 w-auto object-contain sm:h-5 dark:hidden"
            />
            <img
              src={bannerLogoDarkUrl}
              alt=""
              className="hidden h-4 w-auto object-contain sm:h-5 dark:block"
            />
          </Link>
        )}
        <div className="flex-1" />
        <div className="flex items-center gap-x-2">
          {rightSlot}
          {user && (
            <>
              <UserDropdownMenu
                user={user}
                userRoutes={userRoutes}
                logoutReturnTo={logoutReturnTo}
              />
              <Separator orientation="vertical" className="h-5" />
            </>
          )}
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
