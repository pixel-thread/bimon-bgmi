"use client";
import React from "react";
import { Badge } from "@/src/components/ui/badge";
import { Avatar } from "@/src/components/ui/avatar";
import { Button } from "@/src/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PlayerWithStats } from "./types";
import { PlayerCard } from "./PlayerCard";
import { TournamentConfig } from "@/src/lib/types";
import {
  calculateRemainingBanDuration,
  formatRemainingBanDuration,
} from "@/src/utils/banUtils";

interface PlayerTableProps {
  players: PlayerWithStats[];
  sortBy: "name" | "kd" | "kills" | "matches" | "balance" | "banned";
  onPlayerClick: (player: PlayerWithStats) => void;
  tournaments?: TournamentConfig[];
  startingIndex?: number; // Starting index for numbering (e.g., 3 for starting at #4)
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

const CATEGORY_COLORS = {
  "Ultra Noob":
    "bg-purple-100 text-purple-900 border-purple-200 dark:bg-purple-900 dark:text-purple-100 dark:border-purple-800",
  Noob: "bg-green-100 text-green-900 border-green-200 dark:bg-green-900 dark:text-green-100 dark:border-green-800",
  Pro: "bg-yellow-100 text-yellow-900 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-100 dark:border-yellow-800",
  "Ultra Pro":
    "bg-pink-100 text-pink-900 border-pink-200 dark:bg-pink-900 dark:text-pink-100 dark:border-pink-800",
} as const;

const getCategoryColor = (category: string) =>
  CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] ||
  "bg-gray-200 text-gray-800 border-gray-300";

const getKDBadge = () =>
  "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";

const getBalanceBadge = () =>
  "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";

export function PlayerTable({
  players,
  sortBy,
  onPlayerClick,
  tournaments = [],
  startingIndex = 0,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
}: PlayerTableProps) {
  const getColumnHeader = () => {
    switch (sortBy) {
      case "kd":
        return "K/D Ratio";
      case "kills":
        return "Total Kills";
      case "matches":
        return "Matches";
      case "balance":
        return "Balance (₹)";
      case "banned":
        return "Balance (₹)";
      default:
        return "K/D Ratio";
    }
  };

  const getColumnValue = (player: PlayerWithStats) => {
    switch (sortBy) {
      case "kd":
        return (
          <Badge className={`${getKDBadge()} font-bold text-lg px-3 py-1`}>
            {player.overallKD}
          </Badge>
        );
      case "kills":
        return (
          <Badge className="bg-green-100 text-green-800 font-bold">
            {player.totalKills}
          </Badge>
        );
      case "matches":
        return (
          <Badge variant="outline" className="font-bold">
            {player.matchesPlayed}
          </Badge>
        );
      case "balance":
        return (
          <Badge className={getBalanceBadge()}>
            <span className="truncate">
              ₹
              {typeof player.balance === "number"
                ? player.balance.toFixed(2)
                : "0.00"}
            </span>
          </Badge>
        );
      case "banned":
        return (
          <Badge className={getBalanceBadge()}>
            <span className="truncate">
              ₹
              {typeof player.balance === "number"
                ? player.balance.toFixed(2)
                : "0.00"}
            </span>
          </Badge>
        );
      default:
        return (
          <Badge className={`${getKDBadge()} font-bold text-lg px-3 py-1`}>
            {player.overallKD}
          </Badge>
        );
    }
  };

  if (players.length === 0) {
    return (
      <div className="rounded-xl shadow border border-gray-200 dark:border-white/20 overflow-hidden bg-background dark:bg-black text-foreground">
        <div className="p-8 text-center text-muted-foreground">
          No players found
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl shadow border border-gray-200 dark:border-white/20 overflow-hidden bg-background dark:bg-black text-foreground">
      {/* Desktop Table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-accent text-accent-foreground">
            <tr>
              <th className="p-4 text-left" colSpan={4}>
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Players</span>
                  <span className="text-sm text-muted-foreground">
                    Sorted by {getColumnHeader()}
                  </span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {players.map((player, index) => (
              <tr
                key={player.id}
                className={`transition border-b cursor-pointer group ${
                  player.isBanned
                    ? "bg-red-100/90 hover:bg-red-200/90 border-red-300 shadow-sm shadow-red-200/50"
                    : "border-border hover:bg-blue-50/60"
                }`}
                onClick={() => onPlayerClick(player)}
              >
                <td className="p-4 font-medium text-foreground" colSpan={4}>
                  <div className="space-y-2">
                    {/* Row 1: Number + Icon + Name */}
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                          player.isBanned
                            ? "bg-red-500 text-white"
                            : "bg-primary text-primary-foreground"
                        }`}
                      >
                        {startingIndex + index + 1}
                      </div>
                      <Avatar
                        src={player.avatarBase64 || player.avatarUrl}
                        alt={player.name}
                        size="lg"
                        className={`shadow-md group-hover:shadow-lg transition-shadow ${
                          player.isBanned
                            ? "bg-gradient-to-br from-red-500 to-red-600"
                            : "bg-gradient-to-br from-blue-500 to-purple-500"
                        }`}
                        fallbackClassName="text-white"
                      />
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-semibold text-lg transition-colors ${
                            player.isBanned
                              ? "text-red-700"
                              : "group-hover:text-blue-600"
                          }`}
                        >
                          {player.name}
                        </span>
                        {player.isBanned && (
                          <Badge
                            variant="destructive"
                            className="text-xs bg-red-600 hover:bg-red-700"
                          >
                            {(() => {
                              const banInfo = calculateRemainingBanDuration(
                                player,
                                tournaments
                              );
                              return banInfo.isExpired
                                ? "BAN EXPIRED"
                                : `BANNED (${formatRemainingBanDuration(
                                    banInfo.remainingDuration || 0
                                  )})`;
                            })()}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Row 2: Category + Balance/Sorting Value */}
                    <div className="flex items-center gap-3 ml-11">
                      <Badge className={getCategoryColor(player.category)}>
                        {player.category}
                      </Badge>
                      <span className="text-muted-foreground">•</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {getColumnHeader()}:
                        </span>
                        {getColumnValue(player)}
                      </div>
                      {player.isBanned && (
                        <>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-sm text-red-600 italic">
                            {(() => {
                              const banInfo = calculateRemainingBanDuration(
                                player,
                                tournaments
                              );
                              if (banInfo.isExpired) {
                                return "Ban expired";
                              }
                              return `Remaining: ${formatRemainingBanDuration(
                                banInfo.remainingDuration || 0
                              )}`;
                            })()}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card Layout */}
      <div className="sm:hidden space-y-3 p-2">
        {players.map((player, index) => (
          <PlayerCard
            key={player.id}
            player={player}
            index={startingIndex + index}
            sortBy={sortBy}
            onClick={onPlayerClick}
            tournaments={tournaments}
          />
        ))}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && onPageChange && (
        <div className="border-t border-border bg-accent/50 px-3 py-3 sm:px-4">
          {/* Mobile Layout */}
          <div className="flex flex-col gap-3 sm:hidden">
            <div className="text-xs text-muted-foreground text-center">
              Showing players {startingIndex + 1} -{" "}
              {startingIndex + players.length}
              {startingIndex > 0 && " (excluding top 3)"}
            </div>
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="h-8 px-3"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="ml-1">Prev</span>
              </Button>

              <div className="flex items-center gap-1">
                <span className="text-sm font-medium px-2">
                  {currentPage} / {totalPages}
                </span>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="h-8 px-3"
              >
                <span className="mr-1">Next</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden sm:flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing players {startingIndex + 1} -{" "}
              {startingIndex + players.length}
              {startingIndex > 0 && " (excluding top 3 from podium)"}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let page;
                  if (totalPages <= 5) {
                    page = i + 1;
                  } else if (currentPage <= 3) {
                    page = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    page = totalPages - 4 + i;
                  } else {
                    page = currentPage - 2 + i;
                  }

                  return (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => onPageChange(page)}
                      className="h-8 w-8 p-0"
                    >
                      {page}
                    </Button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
