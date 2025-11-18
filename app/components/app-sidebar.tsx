import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, ChevronsLeft, ExternalLink } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { NavLink, useMatches } from "react-router";
import { useOnClickOutside } from "usehooks-ts";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "~/components/ui/sidebar";
import { cn } from "~/lib/utils";

export interface SidebarGroup {
  groupTitle: string;
  items: SidebarMenuItem[];
  hide?: boolean;
}

export type SidebarMenuItem = {
  title: string;
  icon: React.ComponentType;
  hide?: boolean;
} & (
  | {
      type: "link";
      url: string;
      exact?: boolean;
      external?: boolean;
    }
  | {
      type: "group";
      children: SidebarMenuSubItem[];
      defaultOpen?: boolean;
    }
);

export interface SidebarMenuSubItem {
  title: string;
  url: string;
  hide?: boolean;
  exact?: boolean;
}

export function AppSidebar({ groups }: { groups: SidebarGroup[] }) {
  const matches = useMatches();

  return (
    <Sidebar collapsible="icon" className="z-20">
      {({ open, closeMobile }) => (
        <>
          <SidebarContent>
            {groups
              .filter((g) => !g.hide)
              .map(({ groupTitle, items }) => (
                <SidebarGroup key={groupTitle}>
                  <SidebarGroupLabel>{groupTitle}</SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {items
                        .filter((i) => !i.hide)
                        .map((item) =>
                          item.type === "group" ? (
                            <SidebarMenuGroup
                              key={item.title}
                              groupItem={item}
                              openState={open}
                              onNavigate={closeMobile}
                            />
                          ) : item.type === "link" ? (
                            <SidebarMenuItem key={item.title}>
                              <NavLink
                                to={item.url}
                                target={item.external ? "_blank" : undefined}
                                end={item.exact}
                                onClick={closeMobile}
                              >
                                {({ isActive }) => (
                                  <SidebarMenuButton
                                    asChild
                                    isActive={
                                      isActive ||
                                      (!item.exact &&
                                        matches.some(
                                          (m) =>
                                            m.pathname === item.url || m.pathname === `/${item.url}`
                                        ))
                                    }
                                  >
                                    <span>
                                      {item.icon && <item.icon />}
                                      <span>{item.title}</span>
                                      {item.external && <ExternalLink />}
                                    </span>
                                  </SidebarMenuButton>
                                )}
                              </NavLink>
                            </SidebarMenuItem>
                          ) : (
                            <></>
                          )
                        )}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              ))}
          </SidebarContent>
          <SidebarFooter>
            <SidebarMenu>{/* Add footer items here. */}</SidebarMenu>
          </SidebarFooter>
          <SidebarRail />
        </>
      )}
    </Sidebar>
  );
}

const SidebarMenuGroup = ({
  groupItem,
  openState,
  onNavigate,
}: {
  groupItem: SidebarMenuItem & { type: "group" };
  openState: boolean | "expanded" | "collapsed";
  onNavigate: () => void;
}) => {
  const matches = useMatches();

  const [isGroupExpanded, setIsGroupExpanded] = useState(false);
  const [secondarySidebarOpen, setSecondarySidebarOpen] = useState(false);

  const matchedUrls = useMemo(() => {
    const pathnameMatches = new Set<string>(
      matches.flatMap((m) => [m.pathname, m.pathname.replace(/^\//, "")])
    );
    return new Set(groupItem.children.filter((c) => pathnameMatches.has(c.url)).map((c) => c.url));
  }, [matches, groupItem.children]);

  const subMenuItems = groupItem.children.filter((c) => !c.hide);

  const triggerRef = useRef<HTMLButtonElement>(null as unknown as HTMLButtonElement);
  const secondarySidebarRef = useRef<HTMLDivElement>(null as unknown as HTMLDivElement);
  useOnClickOutside<HTMLDivElement | HTMLButtonElement>([secondarySidebarRef, triggerRef], () => {
    if (openState === "collapsed" && secondarySidebarOpen) {
      setSecondarySidebarOpen(false);
    }
  });

  return (
    <>
      <Collapsible
        key={groupItem.title}
        asChild
        defaultOpen={groupItem.defaultOpen || matchedUrls.size > 0}
        open={isGroupExpanded}
        onOpenChange={(open) => {
          setIsGroupExpanded(open);
          if (openState === "collapsed") {
            setSecondarySidebarOpen((prev) => !prev);
          }
        }}
        className="group/collapsible"
      >
        <SidebarMenuItem>
          <CollapsibleTrigger asChild>
            <SidebarMenuButton
              ref={triggerRef}
              isActive={(openState === "collapsed" || !isGroupExpanded) && matchedUrls.size > 0}
            >
              {groupItem.icon && <groupItem.icon />}
              <span>{groupItem.title}</span>
              <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenuSub>
              <SidebarMenuGroupSubItems
                nested
                subItems={subMenuItems}
                getUrlMatches={(url) => matchedUrls.has(url)}
                onNavigate={onNavigate}
              />
            </SidebarMenuSub>
          </CollapsibleContent>
        </SidebarMenuItem>
      </Collapsible>
      <div
        ref={secondarySidebarRef}
        className="fixed top-0 left-(--sidebar-width-icon) flex h-dvh flex-col overflow-hidden"
      >
        <AnimatePresence>
          {openState === "collapsed" && secondarySidebarOpen && (
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.2 }}
              className={cn(
                "bg-sidebar text-sidebar-foreground border-sidebar-border flex h-full w-(--sidebar-width-secondary) flex-col border-r"
              )}
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="h-full w-full"
              >
                <SidebarContent className="h-full w-full">
                  <SidebarGroup>
                    <SidebarGroupLabel secondary>{groupItem.title}</SidebarGroupLabel>
                    <SidebarGroupAction secondary onClick={() => setSecondarySidebarOpen(false)}>
                      <ChevronsLeft />
                    </SidebarGroupAction>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        <SidebarMenuGroupSubItems
                          subItems={subMenuItems}
                          getUrlMatches={(url) => matchedUrls.has(url)}
                          onNavigate={() => {
                            onNavigate();
                            // setSecondarySidebarOpen(false);
                          }}
                        />
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </SidebarGroup>
                </SidebarContent>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

const SidebarMenuGroupSubItems = ({
  nested = false,
  subItems,
  getUrlMatches,
  onNavigate,
}: {
  nested?: boolean;
  subItems: SidebarMenuSubItem[];
  getUrlMatches: (url: string) => boolean;
  onNavigate: () => void;
}) => {
  const MenuItem = nested ? SidebarMenuSubItem : SidebarMenuItem;
  const MenuItemButton = nested ? SidebarMenuSubButton : SidebarMenuButton;

  return (
    <>
      {subItems
        .filter((c) => !c.hide)
        .map((subItem) => (
          <MenuItem key={subItem.title}>
            <NavLink to={subItem.url} end={subItem.exact} onClick={onNavigate}>
              {({ isActive }) => (
                <MenuItemButton
                  asChild
                  isActive={isActive || (!subItem.exact && getUrlMatches(subItem.url))}
                  application={!nested ? "secondary" : "primary"}
                >
                  <span>{subItem.title}</span>
                </MenuItemButton>
              )}
            </NavLink>
          </MenuItem>
        ))}
    </>
  );
};
