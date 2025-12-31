"use client";

import { useTransition, useEffect, useState } from "react";
import { type LucideIcon, Loader2 } from "lucide-react";

import { buttonVariants } from "@/src/components/ui/button";
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

  // Close sidebar when navigation completes
  useEffect(() => {
    if (navigatingTo && pathname === navigatingTo && !isPending) {
      setOpenMobile(false);
      setNavigatingTo(null);
    }
  }, [pathname, navigatingTo, isPending, setOpenMobile]);

  const handleNavigation = (url: string) => {
    // If already on this page, just close the menu
    if (pathname === url) {
      if (isMobile) setOpenMobile(false);
      return;
    }

    // On mobile, show loader and keep sidebar open
    if (isMobile) {
      setNavigatingTo(url);
      startTransition(() => {
        router.push(url);
      });
    } else {
      // On desktop, navigate immediately
      router.push(url);
    }
  };

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {items.map((item) => {
            const isNavigating = navigatingTo === item.url;
            const isAnyNavigating = navigatingTo !== null;
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  onClick={() => handleNavigation(item.url)}
                  disabled={isAnyNavigating && !isNavigating}
                  className={cn(
                    buttonVariants({
                      variant: pathname === item.url ? "default" : "ghost",
                      size: "sm",
                      className: "w-full justify-start",
                    }),
                    isNavigating && "bg-primary/80",
                    isAnyNavigating && !isNavigating && "opacity-50 cursor-not-allowed"
                  )}
                  tooltip={item.title}
                >
                  {isNavigating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    item.icon && <item.icon />
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
