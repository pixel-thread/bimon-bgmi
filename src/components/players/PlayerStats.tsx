"use client";
import React from "react";
import { Badge } from "@/src/components/ui/badge";
import { PlayerWithStats } from "./types";

interface PlayerStatsProps {
  players: PlayerWithStats[];
}

export function PlayerStats({ players }: PlayerStatsProps) {
  const categoryStats = {
    ultraNoobs: players.filter((p) => p.category === "Ultra Noob").length,
    noobs: players.filter((p) => p.category === "Noob").length,
    pros: players.filter((p) => p.category === "Pro").length,
    ultraPros: players.filter((p) => p.category === "Ultra Pro").length,
  };

  return (
    <div className="flex flex-col gap-4 mb-6">
      <div className="flex items-center gap-3 flex-wrap">
        <h2 className="text-2xl font-bold text-foreground tracking-tight">
          Player Statistics
        </h2>
        <Badge variant="secondary" className="text-sm">
          {players.length} Players
        </Badge>
      </div>

      {/* Category Stats */}
      <div className="flex flex-wrap gap-2">
        <Badge className="bg-purple-100 text-purple-900 border-purple-200 dark:bg-purple-900 dark:text-purple-100">
          Ultra Noob: {categoryStats.ultraNoobs}
        </Badge>
        <Badge className="bg-green-100 text-green-900 border-green-200 dark:bg-green-900 dark:text-green-100">
          Noob: {categoryStats.noobs}
        </Badge>
        <Badge className="bg-yellow-100 text-yellow-900 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-100">
          Pro: {categoryStats.pros}
        </Badge>
        <Badge className="bg-pink-100 text-pink-900 border-pink-200 dark:bg-pink-900 dark:text-pink-100">
          Ultra Pro: {categoryStats.ultraPros}
        </Badge>
      </div>
    </div>
  );
}
