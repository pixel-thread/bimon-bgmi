"use client";

import { MailIcon, PlusCircleIcon, type LucideIcon } from "lucide-react";

import { Button, buttonVariants } from "@/src/components/ui/button";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/src/components/ui/sidebar";
import Link from "next/link";
import { cn } from "../lib/utils";
import { usePathname } from "next/navigation";

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
  const { isMobile, setOpenMobile } = useSidebar();

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <Link
                href={item.url}
                onClick={() => isMobile && setOpenMobile(false)}
              >
                <SidebarMenuButton
                  className={cn(
                    buttonVariants({
                      variant: pathname === item.url ? "default" : "ghost",
                      size: "sm",
                      className: "w-full justify-start",
                    }),
                  )}
                  tooltip={item.title}
                >
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
