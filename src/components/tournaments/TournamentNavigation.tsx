"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  FiUsers,
  FiHash,
  FiFileText,
  FiAward,
  FiCheckSquare,
  FiImage,
  FiCode,
} from "react-icons/fi";
import { GamepadIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/src/components/ui/button";

// List of all available games - update this when adding new games
const AVAILABLE_GAMES = ["memory"] as const;
const GAMES_PLAYED_KEY = "gamesPlayed";

const TournamentNavigation = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState<string | null>(null);
  const [hasUnplayedGames, setHasUnplayedGames] = useState(false);

  // Check if there are any games the user hasn't played yet
  useEffect(() => {
    const gamesPlayedStr = localStorage.getItem(GAMES_PLAYED_KEY);
    const gamesPlayed: string[] = gamesPlayedStr ? JSON.parse(gamesPlayedStr) : [];

    // Check if any available game hasn't been played
    const unplayedGames = AVAILABLE_GAMES.filter(game => !gamesPlayed.includes(game));
    setHasUnplayedGames(unplayedGames.length > 0);
  }, []);

  // Mark game as played when user visits a specific game page
  useEffect(() => {
    // Check if user is on a specific game page (e.g., /tournament/games/memory)
    const gameMatch = pathname.match(/^\/tournament\/games\/(\w+)/);
    if (gameMatch) {
      const gameName = gameMatch[1];
      const gamesPlayedStr = localStorage.getItem(GAMES_PLAYED_KEY);
      const gamesPlayed: string[] = gamesPlayedStr ? JSON.parse(gamesPlayedStr) : [];

      if (!gamesPlayed.includes(gameName)) {
        gamesPlayed.push(gameName);
        localStorage.setItem(GAMES_PLAYED_KEY, JSON.stringify(gamesPlayed));

        // Update state to hide notification if all games are now played
        const unplayedGames = AVAILABLE_GAMES.filter(game => !gamesPlayed.includes(game));
        setHasUnplayedGames(unplayedGames.length > 0);
      }
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

  // Clear navigation loading state when pathname changes (navigation complete)
  useEffect(() => {
    if (isNavigating && pathname === isNavigating) {
      setIsNavigating(null);
    }
  }, [pathname, isNavigating]);

  const handleNavigation = (href: string) => {
    if (href === pathname || isNavigating) return; // Prevent same page navigation and multiple clicks

    setIsNavigating(href);

    // Use router.push - loading state will be cleared when pathname changes
    router.push(href, { scroll: false });
  };

  const navItems = [
    { href: "/tournament", label: "Positions", icon: FiHash },
    { href: "/tournament/vote", label: "Vote", icon: FiCheckSquare },
    // Scoreboards hidden from public nav - still accessible via admin
    { href: "/tournament/players", label: "Players", icon: FiUsers },
    {
      href: "/tournament/games",
      label: "Games",
      icon: GamepadIcon,
      glowing: true,
      hasNotification: hasUnplayedGames,
    },
    { href: "/tournament/winners", label: "Winners", icon: FiAward },
    { href: "/tournament/dev-apps", label: "Dev Apps", icon: FiCode },
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
            // Use startsWith for games to support nested routes like /tournament/games/memory
            const isActive = href === "/tournament/games"
              ? pathname.startsWith(href)
              : pathname === href;
            const isLoading = isNavigating === href;

            return (
              <Button
                key={href}
                ref={isActive ? activeTabRef : null}
                onClick={() => handleNavigation(href)}
                disabled={!!isLoading}
                variant="ghost"
                className={`px-4 py-3 h-auto font-medium text-sm flex items-center gap-2 whitespace-nowrap transition-all duration-200 relative rounded-none ${isActive
                  ? "border-b-2 border-indigo-600 text-indigo-600 dark:text-white bg-indigo-50/50 dark:bg-indigo-900/20"
                  : "text-slate-600 hover:text-slate-800 dark:text-white/70 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  } ${isLoading ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
                  }`}
              >
                {isLoading ? (
                  <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Icon
                    className={`h-4 w-4 transition-transform duration-200 ${isActive ? "scale-110" : ""}`}
                    style={glowing ? {
                      color: '#60a5fa',
                      animation: 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                    } : undefined}
                  />
                )}
                <span
                  className={`transition-opacity duration-200 ${isLoading ? "opacity-70" : ""
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
