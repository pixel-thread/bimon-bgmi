"use client";

import { useTransition, useEffect, useState } from "react";
import { type LucideIcon, Loader2 } from "lucide-react";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/src/components/ui/sidebar";
import { cn } from "../lib/utils";
import { usePathname, useRouter } from "next/navigation";

import { useSidebar } from "@/src/components/ui/sidebar";

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: LucideIcon;
  }[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { isMobile, setOpenMobile } = useSidebar();
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Optimistic active state - show navigatingTo as active, otherwise use actual pathname
  const getActiveUrl = () => {
    return navigatingTo || pathname;
  };

  // Check if an item is active (optimistic - shows new item as active immediately)
  const isItemActive = (itemUrl: string) => {
    return getActiveUrl() === itemUrl;
  };

  // Navigation complete or failed - reset navigatingTo
  useEffect(() => {
    if (navigatingTo) {
      // Navigation succeeded - pathname changed to our target
      if (pathname === navigatingTo) {
        setOpenMobile(false);
        setNavigatingTo(null);
      }
      // If isPending becomes false and pathname hasn't changed, navigation may have failed
      // Give it a moment then reset
      if (!isPending && pathname !== navigatingTo) {
        const timeout = setTimeout(() => {
          // Still not navigated? Revert optimistic state
          if (pathname !== navigatingTo) {
            setNavigatingTo(null);
          }
        }, 500);
        return () => clearTimeout(timeout);
      }
    }
  }, [pathname, navigatingTo, isPending, setOpenMobile]);

  const handleNavigation = (url: string) => {
    // If already on this page or already navigating to it, just close the menu
    if (pathname === url || navigatingTo === url) {
      if (isMobile) setOpenMobile(false);
      return;
    }

    // Optimistically set the new URL as active immediately
    setNavigatingTo(url);

    // Start navigation
    startTransition(() => {
      router.push(url);
    });
  };

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-1">
        <SidebarMenu>
          {items.map((item) => {
            const isActive = isItemActive(item.url);
            const isNavigating = navigatingTo === item.url;
            const isAnyNavigating = navigatingTo !== null;

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  onClick={() => handleNavigation(item.url)}
                  disabled={isAnyNavigating && !isNavigating}
                  className={cn(
                    "w-full justify-start transition-all duration-200",
                    // Active state - prominent highlight (optimistic - shows clicked item)
                    isActive && "bg-primary text-primary-foreground font-medium shadow-sm",
                    // Inactive state - subtle with hover
                    !isActive && "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                    // Navigating state - show loading appearance
                    isNavigating && "bg-primary/90 text-primary-foreground",
                    // Disabled during navigation
                    isAnyNavigating && !isNavigating && "opacity-50 cursor-not-allowed"
                  )}
                  tooltip={item.title}
                >
                  {isNavigating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    item.icon && <item.icon className="h-4 w-4" />
                  )}
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
