"use client";
import { usePathname } from "next/navigation";
import { Separator } from "@/src/components/ui/separator";
import { SidebarTrigger } from "@/src/components/ui/sidebar";

const pageNames: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/teams": "Teams",
  "/admin/players": "Players",
  "/admin/recent-matches": "Scoreboards",
  "/admin/winners": "Winners",
  "/admin/games": "Games",
  "/admin/polls": "Polls",
  "/admin/vote": "Vote",
  "/admin/rules": "Rules",
  "/admin/analytics": "Analytics",
  "/admin/income": "Income",
  "/admin/push-subscribers": "Push Subscribers",
  "/admin/admins": "Admins",
  "/admin/profile-images": "Profile Images",
  "/admin/settings": "Settings",
};

export function SiteHeader() {
  const pathname = usePathname();
  const pageName = pageNames[pathname] || "Admin";

  return (
    <header className="group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 px-2 flex h-12 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear">
      <div className="flex items-center justify-between w-full px-4 lg:px-6">
        <div className="flex items-center gap-2">
          <SidebarTrigger />
          <Separator
            orientation="vertical"
            className="data-[orientation=vertical]:h-4"
          />
        </div>
        <h1 className="text-base font-semibold">{pageName}</h1>
      </div>
    </header>
  );
}

