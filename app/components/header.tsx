import type { ComponentProps } from "react";
import { Link, useMatches } from "react-router";
import { useOptimizedImageUrls } from "~/contexts/optimized-image-context";
import useMyOrganization from "~/hooks/use-my-organization";
import type { GetMyOrganizationResult } from "~/lib/services/clients.service";
import { cn, validateBreadcrumb } from "~/lib/utils";
import { BreadcrumbResponsive } from "./breadcrumb-responsive";
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
      <div className="@container flex items-center gap-x-1 sm:gap-x-2">
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
        <DemoLabel />
        <ClientLabel className="flex-1 px-4 opacity-0 @2xl:opacity-100" />
        <div className="flex items-center gap-x-1 sm:gap-x-2">
          {rightSlot}
          {user && (
            <>
              <UserDropdownMenu
                user={user}
                userRoutes={userRoutes}
                logoutReturnTo={logoutReturnTo}
              />
            </>
          )}
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

const DemoLabel = ({ className }: { className?: string }) => {
  let client: GetMyOrganizationResult["client"] | undefined;
  try {
    ({ client } = useMyOrganization());
  } catch (e) {}
  return client?.demoMode ? (
    <div
      className={cn(
        "bg-primary/20 text-primary text-2xs w-min rounded-md p-1 text-center leading-2.5 font-bold tracking-tight uppercase",
        className
      )}
    >
      Demo
    </div>
  ) : null;
};

const ClientLabel = ({ className }: { className?: string }) => {
  let client: GetMyOrganizationResult["client"] | undefined;
  try {
    ({ client } = useMyOrganization());
  } catch (e) {}
  return client?.name ? (
    <div
      className={cn(
        "min-w-0 flex-1 truncate text-center text-xs font-extralight @2xl:text-sm @4xl:text-base @6xl:text-lg",
        className
      )}
    >
      {client.name}
    </div>
  ) : (
    <div className={cn(className)}></div>
  );
};
