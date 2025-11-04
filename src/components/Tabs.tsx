// components/Tabs.tsx
"use client";

import {
  FiUser,
  FiUsers,
  FiSmartphone,
  FiClock,
  FiAward,
  FiFileText,
  FiShield,
  FiBarChart,
} from "react-icons/fi";
import { Gift } from "lucide-react";
import { useAuth } from "@/src/hooks/context/auth/useAuth";

interface TabsProps {
  activeTab:
    | "teams"
    | "settings"
    | "players"
    | "winners"
    | "rules"
    | "wheel"
    | "polls"
    | "admins";
  setActiveTab: React.Dispatch<
    React.SetStateAction<
      | "teams"
      | "settings"
      | "players"
      | "winners"
      | "rules"
      | "wheel"
      | "polls"
      | "admins"
    >
  >;
}

const Tabs = ({ activeTab, setActiveTab }: TabsProps) => {
  const { role, loading } = useAuth();

  // Don't render tabs until role is determined to prevent flash
  if (loading || !role) {
    return (
      <div className="flex overflow-x-auto">
        <div className="px-4 py-3 text-sm text-slate-400">Loading...</div>
      </div>
    );
  }

  const tabsConfig: {
    id: TabsProps["activeTab"];
    label: string;
    Icon: React.FC<React.SVGProps<SVGSVGElement>>;
    superAdminOnly?: boolean;
  }[] = [
    { id: "teams", label: "Teams", Icon: FiSmartphone },
    { id: "settings", label: "Settings", Icon: FiClock },
    { id: "players", label: "Players", Icon: FiUsers },
    { id: "winners", label: "Winners", Icon: FiAward },
    { id: "rules", label: "Rules", Icon: FiFileText },
    { id: "wheel", label: "Claim", Icon: Gift },
    { id: "polls", label: "Polls", Icon: FiBarChart, superAdminOnly: true },
    { id: "admins", label: "Admins", Icon: FiShield, superAdminOnly: true },
  ];

  // Filter tabs based on user role
  const visibleTabs = tabsConfig.filter((tab) => {
    if (tab.superAdminOnly && role !== "super_admin") {
      return false;
    }

    // Teams_admin users have access to teams (edit) + players, rules, winners (read-only)
    if (role === "teams_admin") {
      const allowedForTeamsAdmin = ["teams", "players", "rules", "winners"];
      return allowedForTeamsAdmin.includes(tab.id);
    }

    return true;
  });

  return (
    <div className="flex overflow-x-auto">
      {visibleTabs.map(({ id, label, Icon }) => (
        <button
          key={id}
          onClick={() => setActiveTab(id)}
          className={`px-4 py-3 font-medium text-sm flex items-center gap-2 whitespace-nowrap ${
            activeTab === id
              ? "border-b-2 border-indigo-600 text-indigo-600 dark:text-white"
              : "text-slate-600 hover:text-slate-800 dark:text-white/70 dark:hover:text-white"
          }`}
        >
          <Icon className="h-4 w-4" />
          {label}
        </button>
      ))}
    </div>
  );
};

export default Tabs;
