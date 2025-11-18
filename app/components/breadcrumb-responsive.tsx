"use client";

import * as React from "react";
import { Fragment } from "react";
import { Link } from "react-router";

import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";
import { Button } from "~/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "~/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import useIsMobile from "~/hooks/use-is-mobile";

const ITEMS_TO_DISPLAY = 4;

interface BreadcrumbResponsiveProps {
  items: { id: string; to?: string; label: React.ReactNode }[];
}

export const BreadcrumbResponsive: React.FC<BreadcrumbResponsiveProps> = ({ items }) => {
  const [open, setOpen] = React.useState(false);
  const isMobile = useIsMobile();

  return items.length ? (
    <Breadcrumb>
      <BreadcrumbList>
        {items.length > 1 && (
          <>
            <BreadcrumbItem>
              <BreadcrumbLink href={items[0].to}>{items[0].label}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
          </>
        )}
        {items.length > ITEMS_TO_DISPLAY ? (
          <>
            <BreadcrumbItem>
              {!isMobile ? (
                <DropdownMenu open={open} onOpenChange={setOpen}>
                  <DropdownMenuTrigger className="flex items-center gap-1" aria-label="Toggle menu">
                    <BreadcrumbEllipsis className="h-4 w-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {items.slice(1, -2).map((item) => (
                      <DropdownMenuItem key={item.id}>
                        <Link to={item.to ? item.to : "#"}>{item.label}</Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Drawer open={open} onOpenChange={setOpen}>
                  <DrawerTrigger aria-label="Toggle Menu">
                    <BreadcrumbEllipsis className="h-4 w-4" />
                  </DrawerTrigger>
                  <DrawerContent>
                    <DrawerHeader className="text-left">
                      <DrawerTitle>Navigate to</DrawerTitle>
                      <DrawerDescription>Select a page to navigate to.</DrawerDescription>
                    </DrawerHeader>
                    <div className="grid gap-1 px-4">
                      {items.slice(1, -2).map((item) => (
                        <Link key={item.id} to={item.to ? item.to : "#"} className="py-1 text-sm">
                          {item.label}
                        </Link>
                      ))}
                    </div>
                    <DrawerFooter className="pt-4">
                      <DrawerClose asChild>
                        <Button variant="outline">Close</Button>
                      </DrawerClose>
                    </DrawerFooter>
                  </DrawerContent>
                </Drawer>
              )}
            </BreadcrumbItem>
            <BreadcrumbSeparator />
          </>
        ) : null}
        {items.slice(Math.max(-(items.length - 1), -ITEMS_TO_DISPLAY + 1), -1).map((item) => (
          <Fragment key={item.id}>
            <BreadcrumbItem>
              <BreadcrumbLink asChild className="max-w-20 truncate md:max-w-none">
                <Link to={item.to ? item.to : "#"}>{item.label}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
          </Fragment>
        ))}
        <BreadcrumbItem>
          <BreadcrumbPage className="max-w-20 truncate md:max-w-none">
            {items.at(-1)?.label}
          </BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  ) : (
    <></>
  );
};
