"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FiUsers,
  FiSettings,
  FiFileText,
  FiAward,
  FiBarChart,
  FiUserCheck,
} from "react-icons/fi";
import { Gift, RotateCcw, GamepadIcon } from "lucide-react";
import { Button } from "@/src/components/ui/button";

const AdminNavigation = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState<string | null>(null);

  // Scroll active tab into view when pathname changes
  useEffect(() => {
    if (activeTabRef.current && containerRef.current) {
      const container = containerRef.current;
      const activeTab = activeTabRef.current;

      // Calculate positions
      const containerRect = container.getBoundingClientRect();
      const tabRect = activeTab.getBoundingClientRect();

      // Calculate scroll position to center the active tab
      const scrollLeft =
        tabRect.left -
        containerRect.left +
        container.scrollLeft -
        containerRect.width / 2 +
        tabRect.width / 2;

      // Smooth scroll to the active tab
      container.scrollTo({
        left: scrollLeft,
        behavior: "smooth",
      });
    }
  }, [pathname]);

  const handleNavigation = (href: string) => {
    if (href === pathname || isNavigating) return; // Prevent same page navigation and multiple clicks

    setIsNavigating(href);

    // Use router.push without await to avoid timing issues
    router.push(href, { scroll: false });
    setTimeout(() => {
      setIsNavigating(null);
    }, 300);
  };

  const navItems = [
    { href: "/admin/teams", label: "Teams", icon: FiUsers },
    { href: "/admin/settings", label: "Settings", icon: FiSettings },
    { href: "/admin/players", label: "Players", icon: FiUsers },
    { href: "/admin/winners", label: "Winners", icon: FiAward },
    { href: "/admin/rules", label: "Rules", icon: FiFileText },
    { href: "/admin/wheel", label: "Wheel", icon: RotateCcw },
    { href: "/admin/polls", label: "Polls", icon: FiBarChart },
    { href: "/admin/games", label: "Games", icon: GamepadIcon },
    { href: "/admin/admins", label: "Admins", icon: FiUserCheck },
  ];

  return (
    <div className="relative border-b border-slate-200 dark:border-slate-700">
      {/* Loading indicator - only show when actually navigating */}
      {isNavigating && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-indigo-600/30 z-50">
          <div
            className="h-full bg-indigo-600 animate-pulse"
            style={{ width: "100%" }}
          ></div>
        </div>
      )}

      <div ref={containerRef} className="flex overflow-x-auto scrollbar-hide">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          const isLoading = isNavigating === href;

          return (
            <Button
              key={href}
              ref={isActive ? activeTabRef : null}
              onClick={() => handleNavigation(href)}
              disabled={!!isLoading}
              variant="ghost"
              className={`px-4 py-3 h-auto font-medium text-sm flex items-center gap-2 whitespace-nowrap transition-all duration-200 relative rounded-none ${
                isActive
                  ? "border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/20"
                  : "text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50"
              } ${
                isLoading ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
              }`}
            >
              {isLoading ? (
                <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Icon className={`h-4 w-4`} />
              )}
              <span
                className={`transition-opacity duration-200 ${
                  isLoading ? "opacity-70" : ""
                }`}
              >
                {label}
              </span>
            </Button>
          );
        })}
      </div>
    </div>
  );
};

export default AdminNavigation;
