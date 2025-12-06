"use client";

import * as React from "react";
import {
  SettingsIcon,
  Users,
  Shield,
  Gamepad2,
  Vote,
  BookOpen,
  Trophy,
  DollarSign,
  User,
} from "lucide-react";

import { NavMain } from "@/src/components/nav-main";
import { NavUser } from "@/src/components/nav-user";
import { SidebarThemeToggle } from "@/src/components/common/SidebarThemeToggle";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from "@/src/components/ui/sidebar";
import Link from "next/link";

const data = {
  navMain: [
    {
      title: "Teams",
      url: "/admin/teams",
      icon: Shield,
    },
    {
      title: "Players",
      url: "/admin/players",
      icon: Users,
    },
    {
      title: "Games",
      url: "/admin/games",
      icon: Gamepad2,
    },
    {
      title: "Income",
      url: "/admin/income",
      icon: DollarSign,
    },
    {
      title: "Winners",
      url: "/admin/winners",
      icon: Trophy,
    },
    {
      title: "Polls",
      url: "/admin/polls",
      icon: Vote,
    },
    {
      title: "Rules",
      url: "/admin/rules",
      icon: BookOpen,
    },
    {
      title: "Admins",
      url: "/admin/admins",
      icon: Shield,
    },
    {
      title: "Profile",
      url: "/admin/profile",
      icon: User,
    },
    {
      title: "Settings",
      url: "/admin/settings",
      icon: SettingsIcon,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <Link
              href="/admin"
              className="flex items-center gap-2 px-3 py-2 font-semibold text-lg"
            >
              <Gamepad2 className="h-5 w-5 text-primary" />
              <span>PUBGMI Admin</span>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarThemeToggle />
          </SidebarMenuItem>
        </SidebarMenu>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}

