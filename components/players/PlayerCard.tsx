"use client";
import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { User, Ban } from "lucide-react";
import { PlayerWithStats } from "./types";
import {
  calculateRemainingBanDuration,
  formatRemainingBanDuration,
} from "@/utils/banUtils";
import { TournamentConfig } from "@/lib/types";

interface PlayerCardProps {
  player: PlayerWithStats;
  index: number;
  sortBy: "name" | "kd" | "kills" | "matches" | "balance" | "banned";
  onClick: (player: PlayerWithStats) => void;
  tournaments?: TournamentConfig[];
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

export function PlayerCard({
  player,
  index,
  sortBy,
  onClick,
  tournaments = [],
}: PlayerCardProps) {
  // Calculate remaining ban duration
  const banInfo = calculateRemainingBanDuration(player, tournaments);

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

  const getColumnValue = () => {
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
          <Badge
            className={`${getBalanceBadge()} max-w-[120px] overflow-hidden font-gaming`}
          >
            <span className="truncate block">
              ₹
              {typeof player.balance === "number"
                ? player.balance.toFixed(2)
                : "0.00"}
            </span>
          </Badge>
        );
      case "banned":
        return (
          <Badge
            className={`${getBalanceBadge()} max-w-[120px] overflow-hidden font-gaming`}
          >
            <span className="truncate block">
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

  return (
    <Card
      className={`p-5 border cursor-pointer transition-all duration-200 rounded-lg ${
        player.isBanned
          ? "border-red-400 bg-red-100/90 hover:shadow-lg hover:shadow-red-200/50 hover:border-red-500 shadow-md shadow-red-200/30"
          : "border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-blue-300"
      }`}
      onClick={() => onClick(player)}
    >
      <div className="space-y-3">
        {/* Row 1: Number + Icon + Name */}
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
              player.isBanned
                ? "bg-red-500 text-white"
                : "bg-primary text-primary-foreground"
            }`}
          >
            {index + 1}
          </div>
          <Avatar
            src={player.avatarBase64 || player.avatarUrl}
            alt={player.name}
            size="lg"
            className={`shadow-md ${
              player.isBanned
                ? "bg-gradient-to-br from-red-500 to-red-600"
                : "bg-gradient-to-br from-blue-500 to-purple-500"
            }`}
            fallbackClassName={player.isBanned ? "text-white" : "text-white"}
          />
          <div className="flex items-center gap-x-2 gap-y-1 flex-wrap flex-1 min-w-0">
            <span
              className={`font-military text-lg ${
                player.isBanned ? "text-red-700" : ""
              }`}
              style={{ whiteSpace: "nowrap" }}
            >
              {player.name}
            </span>
            {player.isBanned && (
              <Badge
                variant="destructive"
                className="text-xs bg-red-600 hover:bg-red-700 flex-shrink-0"
              >
                {banInfo.isExpired ? "BAN EXPIRED" : `BANNED`}
              </Badge>
            )}
          </div>
        </div>

        {/* Row 2: Category + Balance/Sorting Value */}
        <div className="flex flex-wrap items-center justify-between pl-11 gap-x-2 gap-y-1 mt-2">
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge className={getCategoryColor(player.category)}>
              {player.category}
            </Badge>
          </div>
          <div className="flex items-center gap-2 min-w-0 flex-1 justify-end">
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              {getColumnHeader()}:
            </span>
            <div className="min-w-0">{getColumnValue()}</div>
          </div>
        </div>

        {/* Ban reason and duration if banned */}
        {player.isBanned && (
          <div className="pl-11 text-sm text-red-600 italic space-y-1 mt-2">
            {player.banReason && <div>Reason: {player.banReason}</div>}
            {banInfo.isExpired ? (
              <div className="text-green-600 font-medium">Ban has expired</div>
            ) : (
              <div>
                Remaining:{" "}
                {formatRemainingBanDuration(banInfo.remainingDuration || 0)}
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
