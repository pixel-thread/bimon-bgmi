"use client";

import {
  BellIcon,
  CreditCardIcon,
  LogOutIcon,
  MoreVerticalIcon,
  UserCircleIcon,
} from "lucide-react";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/src/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/src/components/ui/sidebar";
import { useAuth } from "../hooks/useAuth";
import { UserAvatar, UserButton } from "@clerk/nextjs";

export function NavUser() {
  const { isMobile } = useSidebar();
  const { user } = useAuth();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          className="data-[state=open]:bg-sidebar-accent flex justify-end data-[state=open]:text-sidebar-accent-foreground"
        >
          <UserButton showName>
            <UserAvatar />
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{user?.userName}</span>
              <span className="truncate text-xs text-muted-foreground">
                {user?.email}
              </span>
            </div>
            <MoreVerticalIcon className="ml-auto size-4" />
          </UserButton>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
