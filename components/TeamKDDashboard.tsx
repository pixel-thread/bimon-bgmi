import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getPlayerStats, calculateOverallPlayerKD } from "@/lib/utils";
import PlayerKDEditModal from "./PlayerKDEditModal";
import { Edit, TrendingUp, Target, Skull } from "lucide-react";

interface TeamKDDashboardProps {
  teams: any[];
  onUpdatePlayerStats?: (teamId: string, matchNumber: string, playerKills: string[], playerDeaths: string[]) => void;
}

export default function TeamKDDashboard({ teams, onUpdatePlayerStats }: TeamKDDashboardProps) {
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const [selectedMatch, setSelectedMatch] = useState<string>("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleEditPlayerStats = (team: any, matchNumber: string) => {
    setSelectedTeam(team);
    setSelectedMatch(matchNumber);
    setIsEditModalOpen(true);
  };

  const handleSavePlayerStats = (playerKills: string[], playerDeaths: string[]) => {
    if (selectedTeam && selectedMatch && onUpdatePlayerStats) {
      onUpdatePlayerStats(selectedTeam.id, selectedMatch, playerKills, playerDeaths);
    }
  };

  const getTeamOverallStats = (team: any) => {
    const matchScores = team.matchScores || {};
    let totalKills = 0;
    let totalDeaths = 0;
    let matchesPlayed = 0;

    Object.values(matchScores).forEach((score: any) => {
      if (score.playerKills && score.playerDeaths) {
        totalKills += score.playerKills.reduce((sum: number, kills: number) => sum + kills, 0);
        totalDeaths += score.playerDeaths.reduce((sum: number, deaths: number) => sum + deaths, 0);
        matchesPlayed++;
      }
    });

    return {
      totalKills,
      totalDeaths,
      overallKD: totalDeaths === 0 ? totalKills : parseFloat((totalKills / totalDeaths).toFixed(2)),
      matchesPlayed,
      avgKillsPerMatch: matchesPlayed > 0 ? parseFloat((totalKills / matchesPlayed).toFixed(1)) : 0
    };
  };

  const getTopPerformers = () => {
    const allPlayerStats: any[] = [];
    
    teams.forEach(team => {
      if (team.players) {
        team.players.forEach((player: any, index: number) => {
          const stats = getPlayerStats(player, index, team.matchScores || {});
          allPlayerStats.push({
            ...stats,
            teamName: team.teamName,
            teamId: team.id
          });
        });
      }
    });

    return allPlayerStats.sort((a, b) => b.overallKD - a.overallKD).slice(0, 10);
  };

  const topPerformers = getTopPerformers();

  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="teams">Team Stats</TabsTrigger>
          <TabsTrigger value="players">Top Players</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold">Total Kills</h3>
              </div>
              <p className="text-2xl font-bold text-green-600">
                {teams.reduce((sum, team) => sum + getTeamOverallStats(team).totalKills, 0)}
              </p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Skull className="h-5 w-5 text-red-600" />
                <h3 className="font-semibold">Total Deaths</h3>
              </div>
              <p className="text-2xl font-bold text-red-600">
                {teams.reduce((sum, team) => sum + getTeamOverallStats(team).totalDeaths, 0)}
              </p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold">Avg Team K/D</h3>
              </div>
              <p className="text-2xl font-bold text-blue-600">
                {teams.length > 0 ? 
                  (teams.reduce((sum, team) => sum + getTeamOverallStats(team).overallKD, 0) / teams.length).toFixed(2) 
                  : "0.00"
                }
              </p>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="teams" className="space-y-4">
          {teams.map(team => {
            const teamStats = getTeamOverallStats(team);
            const matchScores = team.matchScores || {};
            
            return (
              <Card key={team.id} className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">{team.teamName}</h3>
                    <p className="text-sm text-muted-foreground">
                      {teamStats.matchesPlayed} matches played
                    </p>
                  </div>
                  <Badge 
                    variant={teamStats.overallKD >= 2 ? "default" : teamStats.overallKD >= 1 ? "secondary" : "outline"}
                    className="text-lg font-bold px-3 py-1"
                  >
                    {teamStats.overallKD} K/D
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Total Kills</p>
                    <p className="text-xl font-bold text-green-600">{teamStats.totalKills}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Total Deaths</p>
                    <p className="text-xl font-bold text-red-600">{teamStats.totalDeaths}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Avg K/M</p>
                    <p className="text-xl font-bold">{teamStats.avgKillsPerMatch}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Match History</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {Object.entries(matchScores).map(([matchNum, score]: [string, any]) => (
                      <div key={matchNum} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                        <span className="text-sm">Match {matchNum}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs">
                            K: {score.playerKills?.reduce((sum: number, k: number) => sum + k, 0) || 0} | 
                            D: {score.playerDeaths?.reduce((sum: number, d: number) => sum + d, 0) || 0}
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditPlayerStats(team, matchNum)}
                            className="h-6 w-6 p-0"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="players" className="space-y-4">
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4">Top 10 Players by K/D Ratio</h3>
            <div className="space-y-3">
              {topPerformers.map((player, index) => (
                <div key={`${player.teamId}-${player.name}`} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-full text-sm font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{player.name}</p>
                      <p className="text-sm text-muted-foreground">{player.teamName}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">K</p>
                      <p className="font-semibold text-green-600">{player.totalKills}</p>
                    </div>
                    
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">D</p>
                      <p className="font-semibold text-red-600">{player.totalDeaths}</p>
                    </div>
                    
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Avg</p>
                      <p className="font-semibold">{player.avgKillsPerMatch}</p>
                    </div>
                    
                    <Badge 
                      variant={player.overallKD >= 2 ? "default" : player.overallKD >= 1 ? "secondary" : "outline"}
                      className="text-lg font-bold px-3 py-1"
                    >
                      {player.overallKD}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {selectedTeam && (
        <PlayerKDEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleSavePlayerStats}
          teamName={selectedTeam.teamName}
          players={selectedTeam.players || []}
          initialPlayerKills={selectedTeam.matchScores?.[selectedMatch]?.playerKills?.map((k: number) => k.toString()) || []}
          initialPlayerDeaths={selectedTeam.matchScores?.[selectedMatch]?.playerDeaths?.map((d: number) => d.toString()) || []}
          matchNumber={selectedMatch}
        />
      )}
    </div>
  );
}