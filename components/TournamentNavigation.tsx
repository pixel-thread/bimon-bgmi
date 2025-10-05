"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  FiUsers,
  FiSmartphone,
  FiFileText,
  FiAward,
  FiBarChart,
} from "react-icons/fi";
import { Gift, GamepadIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

const TournamentNavigation = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState<string | null>(null);
  const [showMemoryGameNotification, setShowMemoryGameNotification] =
    useState(true);
  const [showSnakeGameNotification, setShowSnakeGameNotification] =
    useState(true);

  // Check if user has seen the snake game notification
  useEffect(() => {
    const hasSeenSnakeGame = localStorage.getItem("hasSeenSnakeGame");
    if (hasSeenSnakeGame) {
      setShowSnakeGameNotification(false);
    }
  }, []);

  // Hide notification when user visits games page
  useEffect(() => {
    if (pathname === "/tournament/games") {
      localStorage.setItem("hasSeenMemoryGame", "true");
      localStorage.setItem("hasSeenSnakeGame", "true");
      setShowMemoryGameNotification(false);
      setShowSnakeGameNotification(false);
    }
  }, [pathname]);

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
    { href: "/tournament", label: "Positions", icon: FiSmartphone }, // Changed from /tournament/teams to /tournament
    { href: "/tournament/vote", label: "Vote", icon: FiBarChart },
    {
      href: "/tournament/games",
      label: "Games",
      icon: GamepadIcon,
      glowing: true,
      hasNotification: showMemoryGameNotification || showSnakeGameNotification,
    },
    { href: "/tournament/players", label: "Balance", icon: FiUsers },
    { href: "/tournament/rules", label: "Rules", icon: FiFileText },
    { href: "/tournament/winners", label: "Winners", icon: FiAward },
    { href: "/tournament/wheel", label: "Claim", icon: Gift },
  ];

  return (
    <div className="relative">
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
        {navItems.map(
          ({ href, label, icon: Icon, glowing, hasNotification }) => {
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
                    ? "border-b-2 border-indigo-600 text-indigo-600 dark:text-white bg-indigo-50/50 dark:bg-indigo-900/20"
                    : "text-slate-600 hover:text-slate-800 dark:text-white/70 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50"
                } ${
                  isLoading ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
                }`}
              >
                {isLoading ? (
                  <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Icon
                    className={`h-4 w-4 transition-transform duration-200 ${
                      glowing ? "animate-pulse text-blue-400" : ""
                    } ${isActive ? "scale-110" : ""}`}
                  />
                )}
                <span
                  className={`transition-opacity duration-200 ${
                    isLoading ? "opacity-70" : ""
                  }`}
                >
                  {label}
                </span>
                {hasNotification && !isLoading && (
                  <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 bg-red-500 rounded-full animate-pulse border-2 border-white dark:border-slate-800"></span>
                )}
              </Button>
            );
          }
        )}
      </div>
    </div>
  );
};

export default TournamentNavigation;