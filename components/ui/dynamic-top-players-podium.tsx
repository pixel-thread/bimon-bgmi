"use client";

import React, { useEffect, useRef } from "react";
import { FaTrophy } from "react-icons/fa";
import { PlayerWithStats } from "@/components/players/types";

export interface DynamicTopPlayersPodiumProps {
  players: PlayerWithStats[];
  sortBy: "name" | "kd" | "kills" | "matches" | "balance" | "banned";
  selectedTier: string;
  selectedSeason: string;
  isLoading?: boolean;
  className?: string;
  onPlayerClick?: (player: PlayerWithStats) => void;
}

export const DynamicTopPlayersPodium = React.memo(
  function DynamicTopPlayersPodium({
    players,
    sortBy,
    isLoading = false,
    className,
    onPlayerClick,
  }: DynamicTopPlayersPodiumProps) {
    // Ref for the scroll container
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Get top 3 players based on current sorting (memoized)
    const topPlayers = React.useMemo(() => players.slice(0, 3), [players]);

    // Auto-scroll to center the #1 player
    useEffect(() => {
      if (scrollContainerRef.current && topPlayers.length > 0) {
        const container = scrollContainerRef.current;

        // Calculate the scroll position to center the #1 player (2nd card)
        const calculateScrollPosition = () => {
          const card2Width = 128; // w-32 = 128px
          const card1Width = 144; // w-36 = 144px
          const gap = 12; // gap-3 = 12px

          // Scroll to show #1 centered: #2 width + gap + half of #1 width - some offset for better centering
          return card2Width + gap + card1Width / 2 - 50; // -50px for better visual centering
        };

        const scrollToPosition = calculateScrollPosition();

        // Smooth scroll to the calculated position after a short delay
        const timer = setTimeout(() => {
          container.scrollTo({
            left: scrollToPosition,
            behavior: "smooth",
          });
        }, 600); // 600ms delay to ensure the component is fully rendered and visible

        return () => clearTimeout(timer);
      }
    }, [topPlayers]);

    // Generate rank display based on sort criteria (memoized)
    const getRankDisplay = React.useCallback(
      (player: PlayerWithStats) => {
        switch (sortBy) {
          case "balance":
            return player.balance ? `₹${player.balance}` : "₹0";
          case "kd":
            return `${player.overallKD.toFixed(2)} K/D`;
          case "kills":
            return `${player.totalKills} Kills`;
          case "matches":
            return `${player.matchesPlayed} Matches`;
          case "name":
            return player.category;
          case "banned":
            return player.balance ? `₹${player.balance}` : "₹0";
          default:
            return `${player.overallKD.toFixed(2)} K/D`;
        }
      },
      [sortBy]
    );

    // Player card component with 9:22 aspect ratio (memoized)
    const PlayerCard = React.memo(
      ({ player, position }: { player: PlayerWithStats; position: number }) => {
        const positionColors = {
          1: {
            gradient: "from-yellow-400/15 via-yellow-500/10 to-yellow-600/20",
            border: "border-yellow-400/40 dark:border-yellow-400/60",
            badge: "bg-yellow-400 text-yellow-900",
            shadow: "shadow-yellow-400/20 dark:shadow-yellow-400/30",
            bgFallback:
              "bg-gradient-to-br from-yellow-50/80 to-yellow-100/60 dark:from-yellow-900/20 dark:to-yellow-800/30",
          },
          2: {
            gradient: "from-gray-300/15 via-gray-400/10 to-gray-500/20",
            border: "border-gray-400/40 dark:border-gray-400/60",
            badge: "bg-gray-400 text-gray-900",
            shadow: "shadow-gray-400/20 dark:shadow-gray-400/30",
            bgFallback:
              "bg-gradient-to-br from-gray-50/80 to-gray-100/60 dark:from-gray-800/40 dark:to-gray-700/50",
          },
          3: {
            gradient: "from-amber-600/15 via-amber-700/10 to-amber-800/20",
            border: "border-amber-600/40 dark:border-amber-500/60",
            badge: "bg-amber-600 text-amber-100",
            shadow: "shadow-amber-600/20 dark:shadow-amber-500/30",
            bgFallback:
              "bg-gradient-to-br from-amber-50/80 to-amber-100/60 dark:from-amber-900/20 dark:to-amber-800/30",
          },
        };

        const colors = positionColors[position as keyof typeof positionColors];

        return (
          <div
            className={`
        relative overflow-hidden rounded-2xl border-2 ${colors.border} ${colors.shadow} shadow-lg
        ${colors.bgFallback} backdrop-blur-sm
        transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer
      `}
            style={{ aspectRatio: "9/22" }}
            onClick={() => onPlayerClick?.(player)}
          >
            {/* Subtle background pattern for better theme support */}
            <div
              className={`absolute inset-0 bg-gradient-to-br ${colors.gradient}`}
            />

            {/* Character Background Image - Full body standing character (bigger and closer) */}
            {player.characterAvatarBase64 && (
              <div
                className="absolute inset-0 opacity-95"
                style={{
                  backgroundImage: `linear-gradient(135deg, 
                    rgba(59, 130, 246, 0.1) 0%, 
                    rgba(147, 51, 234, 0.1) 25%, 
                    rgba(236, 72, 153, 0.1) 50%, 
                    rgba(245, 158, 11, 0.1) 75%, 
                    rgba(16, 185, 129, 0.1) 100%
                  ), url(${player.characterAvatarBase64})`,
                  backgroundSize: "cover, auto 170%", // Gradient covers all, character 170% height
                  backgroundPosition: "center, center 15%", // Gradient centered, character higher and centered
                  backgroundRepeat: "no-repeat, no-repeat",
                }}
              />
            )}

            {/* Fallback gradient when no character image */}
            {!player.characterAvatarBase64 && (
              <div
                className="absolute inset-0 opacity-80"
                style={{
                  background: `linear-gradient(135deg, 
                    rgba(59, 130, 246, 0.3) 0%, 
                    rgba(147, 51, 234, 0.3) 25%, 
                    rgba(236, 72, 153, 0.3) 50%, 
                    rgba(245, 158, 11, 0.3) 75%, 
                    rgba(16, 185, 129, 0.3) 100%
                  )`,
                }}
              />
            )}

            {/* Adaptive Gradient Overlay - works better with both themes */}
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(to bottom, 
              rgba(0,0,0,0) 0%, 
              rgba(0,0,0,0) 50%, 
              rgba(0,0,0,0.1) 60%, 
              rgba(0,0,0,0.3) 70%, 
              rgba(0,0,0,0.6) 80%, 
              rgba(0,0,0,0.8) 90%, 
              rgba(0,0,0,0.95) 100%
            )`,
              }}
            />

            {/* Position Badge - Top Center */}
            <div
              className={`
          absolute top-3 left-1/2 transform -translate-x-1/2 px-3 py-1 rounded-full ${colors.badge}
          flex items-center justify-center text-sm font-bold shadow-lg
          ring-2 ring-white/20
        `}
            >
              #{position}
            </div>

            {/* Banned Stamp Overlay */}
            {player.isBanned && (
              <div
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                style={{
                  transform: "rotate(-19deg)",
                  opacity: 0.85,
                }}
              >
                <span
                  className="text-red-600 dark:text-red-400 text-3xl font-bold tracking-wider"
                  style={{
                    textShadow: "2px 2px 4px rgba(0, 0, 0, 0.5)",
                    WebkitTextStroke: "1px rgba(255, 255, 255, 0.3)",
                  }}
                >
                  BANNED
                </span>
              </div>
            )}

            {/* Content */}
            <div className="absolute inset-0 flex flex-col justify-end p-4">
              {/* Profile Picture - Memoized to prevent refresh */}
              <div className="flex justify-center mb-3">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-3 border-white/80 shadow-lg ring-2 ring-black/10">
                    {player.avatarBase64 ? (
                      <img
                        src={player.avatarBase64}
                        alt={player.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        style={{ imageRendering: "auto" }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                        {player.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  {/* Glow effect for 1st place */}
                  {position === 1 && (
                    <div className="absolute inset-0 rounded-full bg-yellow-400/30 blur-md -z-10 scale-110" />
                  )}
                </div>
              </div>

              {/* Player Info */}
              <div className="text-center text-white px-1">
                <div className="mb-1 h-7">
                  <div
                    className="font-military text-lg leading-tight drop-shadow-lg text-shadow truncate"
                    title={player.name}
                  >
                    {player.name}
                  </div>
                </div>
                <div className="opacity-90 font-medium drop-shadow text-shadow h-5">
                  <div className="text-sm truncate" title={getRankDisplay(player)}>
                    {getRankDisplay(player)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      }
    );

    if (isLoading) {
      return (
        <div
          className={`bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-2xl border border-gray-200/60 dark:border-gray-700/60 p-6 shadow-lg ${className}`}
        >
          <h2 className="text-xl font-bold flex items-center gap-2 mb-6 text-center justify-center text-gray-800 dark:text-gray-200">
            <FaTrophy className="h-6 w-6 text-yellow-500" />
            Loading Top Players...
          </h2>
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
          </div>
        </div>
      );
    }

    if (topPlayers.length === 0) {
      return (
        <div
          className={`bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-2xl border border-gray-200/60 dark:border-gray-700/60 p-6 shadow-lg ${className}`}
        >
          <h2 className="text-xl font-bold flex items-center gap-2 mb-6 text-center justify-center text-gray-800 dark:text-gray-200">
            <FaTrophy className="h-6 w-6 text-yellow-500" />
            Top 3 Players
          </h2>
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">
            No players found with current filters
          </p>
        </div>
      );
    }

    const [first, second, third] = topPlayers;


    return (
      <div
        className={`bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-2xl border border-gray-200/60 dark:border-gray-700/60 p-6 shadow-lg ${className}`}
      >
        {/* Desktop Layout - Podium style with 9:22 aspect ratio */}
        <div className="hidden md:block">
          <div className="flex items-end justify-center gap-4 px-4 min-h-[200px]">
            {/* 2nd Place - Left */}
            <div className="w-32 flex-shrink-0">
              {second ? (
                <PlayerCard player={second} position={2} />
              ) : (
                <div className="w-full h-48 opacity-30 border-2 border-dashed border-gray-300 rounded-2xl flex items-center justify-center">
                  <span className="text-gray-400 text-sm">#2</span>
                </div>
              )}
            </div>

            {/* 1st Place - Center (Larger) */}
            <div className="w-36 flex-shrink-0">
              {first ? (
                <PlayerCard player={first} position={1} />
              ) : (
                <div className="w-full h-56 opacity-30 border-2 border-dashed border-yellow-300 rounded-2xl flex items-center justify-center">
                  <span className="text-yellow-400 text-sm">#1</span>
                </div>
              )}
            </div>

            {/* 3rd Place - Right */}
            <div className="w-32 flex-shrink-0">
              {third ? (
                <PlayerCard player={third} position={3} />
              ) : (
                <div className="w-full h-44 opacity-30 border-2 border-dashed border-gray-300 rounded-2xl flex items-center justify-center">
                  <span className="text-gray-400 text-sm">#3</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Layout - Horizontal Scrollable Podium */}
        <div className="md:hidden -mx-2">
          {/* Horizontal scroll container with smooth scrolling - reduced padding */}
          <div
            ref={scrollContainerRef}
            className="overflow-x-auto scrollbar-hide smooth-scroll scroll-snap-x scroll-snap-mandatory"
          >
            <div
              className="flex items-end gap-3 min-h-[200px]"
              style={{
                width: "max-content",
                paddingLeft: "20vw", // Reduced from 25vw
                paddingRight: "20vw", // Reduced from 25vw
              }}
            >
              {/* 2nd Place - Left */}
              <div className="w-32 flex-shrink-0 scroll-snap-center">
                {second ? (
                  <PlayerCard player={second} position={2} />
                ) : (
                  <div className="w-full h-44 opacity-30 border-2 border-dashed border-gray-300 rounded-2xl flex items-center justify-center">
                    <span className="text-gray-400 text-xs">#2</span>
                  </div>
                )}
              </div>

              {/* 1st Place - Center (Larger) */}
              <div className="w-36 flex-shrink-0 scroll-snap-center">
                {first ? (
                  <PlayerCard player={first} position={1} />
                ) : (
                  <div className="w-full h-52 opacity-30 border-2 border-dashed border-yellow-300 rounded-2xl flex items-center justify-center">
                    <span className="text-yellow-400 text-xs">#1</span>
                  </div>
                )}
              </div>

              {/* 3rd Place - Right */}
              <div className="w-32 flex-shrink-0 scroll-snap-center">
                {third ? (
                  <PlayerCard player={third} position={3} />
                ) : (
                  <div className="w-full h-40 opacity-30 border-2 border-dashed border-gray-300 rounded-2xl flex items-center justify-center">
                    <span className="text-gray-400 text-xs">#3</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Scroll indicator for mobile */}
          <div className="flex justify-center mt-3 px-6">
            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <span>←</span>
              <span>Swipe to see all</span>
              <span>→</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
);
