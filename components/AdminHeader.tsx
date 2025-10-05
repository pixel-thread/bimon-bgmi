// components/AdminHeader.tsx
"use client";

import { FiUsers } from "react-icons/fi";
import { formatDateDDMMYYYY } from "../utils/dateFormat";
import { useAuth } from "@/hooks/useAuth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

interface AdminHeaderProps {
  activeTab:
    | "teams"
    | "settings"
    | "players"
    | "winners"
    | "rules"
    | "wheel"
    | "polls"
    | "admins";
  role?: "full" | "restricted";
}

const AdminHeader = ({ activeTab, role = "full" }: AdminHeaderProps) => {
  const { user, role: userRole, username, displayName } = useAuth();
  const router = useRouter();

  let subtitle = "";
  let title = "Administration";

  if (role === "restricted") {
    title = "Team Management";
    subtitle = "Edit team points and manage tournament teams.";
  } else {
    if (activeTab === "teams") subtitle = "Team management.";
    else if (activeTab === "settings")
      subtitle = "Tournament configuration and season management.";
    else if (activeTab === "players")
      subtitle = "Player management and statistics.";
    else if (activeTab === "winners")
      subtitle = "Tournament results and statistics.";
    else if (activeTab === "rules")
      subtitle = "Tournament rules and regulations management.";
    else if (activeTab === "wheel")
      subtitle = "Winners wheel for selecting tournament winners.";
    else if (activeTab === "admins")
      subtitle = "Manage admin access and permissions.";
  }



  const getRoleBadge = () => {
    if (userRole === "super_admin") {
      return (
        <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full font-normal">
          Super Admin
        </span>
      );
    }
    if (userRole === "teams_admin") {
      return (
        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-normal">
          Teams Admin
        </span>
      );
    }
    return null;
  };

  return (
    <header className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold flex items-center gap-3 text-slate-800 dark:text-foreground">
            <FiUsers className="h-8 w-8 text-indigo-600" />
            {title}
          </h1>
          {getRoleBadge()}
        </div>
        <p className="text-sm text-slate-500 dark:text-muted-foreground">
          {subtitle}
        </p>
      </div>

      {/* User Info & Actions - Removed to keep header clean */}
    </header>
  );
};

export default AdminHeader;
