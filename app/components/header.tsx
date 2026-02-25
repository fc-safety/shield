import type { ComponentProps } from "react";
import { Link, useMatches } from "react-router";
import { useOptionalActiveAccessGrant } from "~/contexts/active-access-grant-context";
import { useOptimizedImageUrls } from "~/contexts/optimized-image-context";
import useMyOrganization from "~/hooks/use-my-organization";
import type { GetMyOrganizationResult } from "~/lib/services/clients.service";
import { cn, validateBreadcrumb } from "~/lib/utils";
import { BreadcrumbResponsive } from "./breadcrumb-responsive";
import { ClientSwitcher } from "./client-switcher";
import { UserDropdownMenu } from "./user-dropdown-menu";

function LogoLink({
  to,
  logo: { light, dark },
  className,
}: { to: string; logo: { light: string; dark: string }; className?: string } & ComponentProps<
  typeof Link
>) {
  return (
    <Link to={to} className={cn(className)}>
      <img src={light} alt="" className="h-4 w-auto object-contain sm:h-4.5 dark:hidden" />
      <img src={dark} alt="" className="hidden h-4 w-auto object-contain sm:h-4.5 dark:block" />
    </Link>
  );
}

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
        "@container flex shrink-0 flex-col gap-y-1 px-2 pt-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:pt-2 sm:px-4 sm:pt-4",
        className
      )}
    >
      <div className="flex flex-wrap items-center gap-1 sm:gap-2">
        <div className="flex shrink-0 grow items-center gap-x-1 sm:gap-x-2">
          {leftSlot}
          {showBannerLogo && (
            <LogoLink
              to={homeTo}
              logo={{ light: bannerLogoLightUrl, dark: bannerLogoDarkUrl }}
              className="shrink-0"
            />
          )}
          <DemoLabel />
        </div>
        <ClientSwitcherOrLabel className="hidden max-w-72 px-4 @2xl:flex" />
        <div className="flex shrink-0 grow items-center justify-end gap-x-1 sm:gap-x-2">
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
      <ClientSwitcherOrLabel className="flex self-stretch px-4 @md:self-end @2xl:hidden" />
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

/**
 * Renders ClientSwitcher if ClientAccessContext is available,
 * otherwise falls back to the simple ClientLabel.
 */
const ClientSwitcherOrLabel = ({ className }: { className?: string }) => {
  const clientAccess = useOptionalActiveAccessGrant();
  if (clientAccess) {
    return <ClientSwitcher className={className} />;
  }
  return null;
};
