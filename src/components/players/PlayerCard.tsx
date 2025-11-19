"use client";
import React from "react";
import { Card } from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { Avatar } from "@/src/components/ui/avatar";
import {
  calculateRemainingBanDuration,
  formatRemainingBanDuration,
} from "@/src/utils/banUtils";
import { TournamentT } from "@/src/types/tournament";
import { PlayerWithStatsT } from "@/src/types/player";

interface PlayerCardProps {
  player: PlayerWithStatsT;
  index: number;
  sortBy: "name" | "kd" | "kills" | "matches" | "balance" | "banned";
  onClick: (player: PlayerWithStatsT) => void;
  tournaments?: TournamentT[];
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
  const banInfo = {};

  return (
    <Card
      // className={`p-5 border cursor-pointer transition-all duration-200 rounded-lg ${
      // player.isBanned
      //   ? "border-red-400 bg-red-100/90 hover:shadow-lg hover:shadow-red-200/50 hover:border-red-500 shadow-md shadow-red-200/30"
      //    : "border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-blue-300"
      // }`}
      onClick={() => onClick(player)}
    ></Card>
  );
}
