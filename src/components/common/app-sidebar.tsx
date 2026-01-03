"use client";

import * as React from "react";
import { useState, useTransition, useEffect } from "react";
import {
  SettingsIcon,
  Users,
  Shield,
  Gamepad2,
  Vote,
  BookOpen,
  Trophy,
  DollarSign,
  ImageIcon,
  Bell,
  BarChart3,
  ChevronRight,
  LayoutDashboard,
  Megaphone,
  Settings2,
  Loader2,
} from "lucide-react";

import { NavUser } from "@/src/components/nav-user";
import { SidebarThemeToggle } from "@/src/components/common/SidebarThemeToggle";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  useSidebar,
} from "@/src/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/src/components/ui/collapsible";
import Link from "next/link";
import { useAuth } from "@/src/hooks/context/auth/useAuth";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/src/lib/utils";
import { LucideIcon } from "lucide-react";

type NavItem = {
  title: string;
  url: string;
  icon: LucideIcon;
  superAdminOnly?: boolean;
};

type NavGroup = {
  title: string;
  icon: LucideIcon;
  items: NavItem[];
  superAdminOnly?: boolean;
};

const navGroups: NavGroup[] = [
  {
    title: "Tournament",
    icon: Trophy,
    items: [
      { title: "Teams", url: "/admin/teams", icon: Shield },
      { title: "Players", url: "/admin/players", icon: Users },
      { title: "Scoreboards", url: "/admin/recent-matches", icon: ImageIcon },
      { title: "Winners", url: "/admin/winners", icon: Trophy },
    ],
  },
  {
    title: "Platform",
    icon: LayoutDashboard,
    items: [
      { title: "Games", url: "/admin/games", icon: Gamepad2 },
      { title: "Polls", url: "/admin/polls", icon: Vote },
      { title: "Vote", url: "/admin/vote", icon: Megaphone },
      { title: "Rules", url: "/admin/rules", icon: BookOpen },
    ],
  },
  {
    title: "Insights",
    icon: BarChart3,
    superAdminOnly: true,
    items: [
      { title: "Analytics", url: "/admin/analytics", icon: BarChart3 },
      { title: "Income", url: "/admin/income", icon: DollarSign },
      { title: "Push Subscribers", url: "/admin/push-subscribers", icon: Bell },
    ],
  },
  {
    title: "Admin",
    icon: Settings2,
    items: [
      { title: "Admins", url: "/admin/admins", icon: Shield, superAdminOnly: true },
      { title: "Profile Images", url: "/admin/profile-images", icon: ImageIcon },
      { title: "Settings", url: "/admin/settings", icon: SettingsIcon },
    ],
  },
];

function NavGroupCollapsible({
  group,
  isSuperAdmin,
  navigatingTo,
  onNavigate,
}: {
  group: NavGroup;
  isSuperAdmin: boolean;
  navigatingTo: string | null;
  onNavigate: (url: string) => void;
}) {
  const pathname = usePathname();

  // Filter items based on permissions
  const filteredItems = group.items.filter(
    (item) => !item.superAdminOnly || isSuperAdmin
  );

  // Optimistic active state - show navigatingTo as active, otherwise use actual pathname
  const getActiveUrl = () => navigatingTo || pathname;

  // Check if any item in this group is active (including optimistic)
  const isGroupActive = filteredItems.some((item) => getActiveUrl() === item.url);

  // Initialize open state based on whether group has active item
  const [isOpen, setIsOpen] = useState(isGroupActive);

  // Update open state when pathname changes or when navigating
  React.useEffect(() => {
    if (isGroupActive && !isOpen) {
      setIsOpen(true);
    }
  }, [isGroupActive, isOpen]);

  if (filteredItems.length === 0) return null;

  const isAnyNavigating = navigatingTo !== null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="group/collapsible">
      <SidebarGroup className="p-0">
        <CollapsibleTrigger asChild>
          <SidebarGroupLabel className="cursor-pointer hover:bg-muted/50 rounded-md px-2 py-1.5 mb-1 transition-colors">
            <div className="flex items-center gap-2 flex-1">
              <group.icon className="h-4 w-4" />
              <span className="font-medium">{group.title}</span>
            </div>
            <ChevronRight className={cn(
              "h-4 w-4 transition-transform duration-200",
              isOpen && "rotate-90"
            )} />
          </SidebarGroupLabel>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarGroupContent className="pl-4">
            <SidebarMenu>
              {filteredItems.map((item) => {
                const isActive = getActiveUrl() === item.url;
                const isNavigating = navigatingTo === item.url;

                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      onClick={() => onNavigate(item.url)}
                      disabled={isAnyNavigating && !isNavigating}
                      className={cn(
                        "w-full justify-start transition-all duration-200",
                        isActive && "bg-primary text-primary-foreground font-medium shadow-sm",
                        !isActive && "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                        isNavigating && "bg-primary/90 text-primary-foreground",
                        isAnyNavigating && !isNavigating && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      {isNavigating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <item.icon className="h-4 w-4" />
                      )}
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  );
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  // Filter groups based on permissions
  const filteredGroups = navGroups.filter(
    (group) => !group.superAdminOnly || isSuperAdmin
  );

  // Navigation complete - reset navigatingTo and close mobile menu
  useEffect(() => {
    if (navigatingTo) {
      if (pathname === navigatingTo) {
        setOpenMobile(false);
        setNavigatingTo(null);
      }
      if (!isPending && pathname !== navigatingTo) {
        const timeout = setTimeout(() => {
          if (pathname !== navigatingTo) {
            setNavigatingTo(null);
          }
        }, 500);
        return () => clearTimeout(timeout);
      }
    }
  }, [pathname, navigatingTo, isPending, setOpenMobile]);

  const handleNavigation = (url: string) => {
    if (pathname === url || navigatingTo === url) {
      if (isMobile) setOpenMobile(false);
      return;
    }
    setNavigatingTo(url);
    startTransition(() => {
      router.push(url);
    });
  };





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
      <SidebarContent className="gap-0">
        {filteredGroups.map((group) => (
          <NavGroupCollapsible
            key={group.title}
            group={group}
            isSuperAdmin={isSuperAdmin}
            navigatingTo={navigatingTo}
            onNavigate={handleNavigation}
          />
        ))}
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
