"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useUser, useClerk } from "@clerk/nextjs";
import { LogOut } from "lucide-react";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/src/components/ui/sidebar";
import { useAuth } from "../hooks/context/auth/useAuth";
import { getDisplayName } from "@/src/utils/displayName";
import { cn } from "@/src/lib/utils";
import Image from "next/image";

export function NavUser() {
  const { user } = useAuth();
  const { user: clerkUser } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const pathname = usePathname();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const isProfileActive = pathname === "/profile";

  // Get profile image: custom characterImage > Clerk image > fallback
  const profileImage = user?.player?.characterImage?.publicUrl || clerkUser?.imageUrl;
  const displayName = getDisplayName(user?.displayName, user?.userName);
  const initials = displayName?.charAt(0).toUpperCase() || "?";

  const handleSignOut = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Don't navigate to profile
    setIsSigningOut(true);
    try {
      await signOut();
      window.location.href = "/";
    } catch (error) {
      console.error("Error signing out:", error);
      setIsSigningOut(false);
    }
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          onClick={() => router.push("/profile")}
          className={cn(
            "data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground cursor-pointer transition-all",
            isProfileActive && "bg-primary/10 border border-primary/20"
          )}
        >
          {/* Avatar on left */}
          <div className="h-8 w-8 rounded-full overflow-hidden flex-shrink-0 bg-muted flex items-center justify-center">
            {profileImage ? (
              <Image
                src={profileImage}
                alt={displayName || "User"}
                width={32}
                height={32}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-sm font-medium text-muted-foreground">
                {initials}
              </span>
            )}
          </div>

          {/* Name and email in middle */}
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium">{displayName}</span>
            <span className="truncate text-xs text-muted-foreground">
              {user?.email}
            </span>
          </div>

          {/* Logout icon on right */}
          <div
            onClick={handleSignOut}
            role="button"
            aria-disabled={isSigningOut}
            className="h-8 w-8 rounded-md flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-colors cursor-pointer"
            title="Sign Out"
          >
            {isSigningOut ? (
              <div className="h-4 w-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <LogOut className="h-4 w-4" />
            )}
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
