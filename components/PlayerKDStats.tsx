import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getPlayerStats, PlayerStats } from "@/lib/utils";

interface PlayerKDStatsProps {
  players: { ign: string }[];
  matchScores: { [matchNumber: string]: any };
  className?: string;
}

export default function PlayerKDStats({ players, matchScores, className = "" }: PlayerKDStatsProps) {
  const playerStats: PlayerStats[] = players.map((player, index) => 
    getPlayerStats(player, index, matchScores)
  );

  // Sort players by K/D ratio (descending)
  const sortedStats = [...playerStats].sort((a, b) => b.overallKD - a.overallKD);

  return (
    <Card className={`p-4 ${className}`}>
      <h3 className="text-lg font-semibold mb-3">Player K/D Statistics</h3>
      <div className="space-y-3">
        {sortedStats.map((stats, index) => (
          <div key={stats.name} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-full text-sm font-bold">
                {index + 1}
              </div>
              <div>
                <p className="font-medium">{stats.name}</p>
                <p className="text-sm text-muted-foreground">
                  {stats.matchesPlayed} matches played
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Kills</p>
                <p className="font-semibold text-green-600">{stats.totalKills}</p>
              </div>
              
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Deaths</p>
                <p className="font-semibold text-red-600">{stats.totalDeaths}</p>
              </div>
              
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Avg K/M</p>
                <p className="font-semibold">{stats.avgKillsPerMatch}</p>
              </div>
              
              <Badge 
                variant={stats.overallKD >= 2 ? "default" : stats.overallKD >= 1 ? "secondary" : "outline"}
                className="text-lg font-bold px-3 py-1"
              >
                {stats.overallKD} K/D
              </Badge>
            </div>
          </div>
        ))}
      </div>
      
      {playerStats.length === 0 && (
        <p className="text-center text-muted-foreground py-8">
          No player statistics available yet
        </p>
      )}
    </Card>
  );
}