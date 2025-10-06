"use client";
import React, { useState } from "react";

import { Card } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import PlayerKDEditModal from "./PlayerKDEditModal";
import TeamKDDashboard from "./TeamKDDashboard";
import { calculateKD, getPlayerStats } from "@/src/lib/utils";

// Demo component to showcase the K/D tracking functionality
export default function KDTrackingDemo() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<any>(null);

  // Sample team data with player names following the "ks juster_Nangiai" format
  const sampleTeams = [
    {
      id: "team1",
      teamName: "Alpha Squad",
      players: [{ ign: "ks juster" }, { ign: "ks Nangiai" }],
      matchScores: {
        "1": {
          kills: 8,
          placementPoints: 10,
          playerKills: [5, 3],
          playerKD: [5.0, 3.0],
          playerParticipation: [true, true], // Both players participated
        },
        "2": {
          kills: 4,
          placementPoints: 6,
          playerKills: [4, 0],
          playerKD: [4.0, 0.0],
          playerParticipation: [true, false], // Only first player participated
        },
      },
    },
    {
      id: "team2",
      teamName: "Beta Warriors",
      players: [{ ign: "pro_player1" }, { ign: "noob_player2" }],
      matchScores: {
        "1": {
          kills: 4,
          placementPoints: 5,
          playerKills: [2, 2],
          playerKD: [2.0, 2.0],
          playerParticipation: [true, true], // Both players participated
        },
        "2": {
          kills: 5,
          placementPoints: 4,
          playerKills: [5, 0],
          playerKD: [2.5, 0.0],
          playerParticipation: [true, false], // Only first player participated
        },
      },
    },
  ];

  const handleEditKD = (team: any) => {
    setSelectedTeam(team);
    setIsModalOpen(true);
  };

  const handleSaveKD = (
    playerKills: string[],
    playerDeaths: string[],
    playerParticipation: boolean[]
  ) => {
    console.log("Saving K/D data:", {
      playerKills,
      playerDeaths,
      playerParticipation,
    });
    // In real implementation, this would update the team data with participation tracking
    setIsModalOpen(false);
    setSelectedTeam(null);
  };

  const getTeamKD = (team: any) => {
    let totalKills = 0;
    let matchesPlayed = 0;

    Object.values(team.matchScores).forEach((score: any) => {
      totalKills +=
        score.playerKills?.reduce((sum: number, k: number) => sum + k, 0) || 0;
      matchesPlayed++;
    });

    // In PUBG/BGMI, each match = 1 death automatically for each player
    const totalDeaths = matchesPlayed * team.players.length;
    return calculateKD(totalKills, totalDeaths);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">
          PUBG/BGMI K/D Tracking System
        </h1>
        <p className="text-muted-foreground">
          Track individual player kills, deaths, and K/D ratios for each match
        </p>
      </div>

      {/* Feature Overview */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Key Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h3 className="font-medium text-green-600">
              ✓ Individual Player Tracking
            </h3>
            <p className="text-sm text-muted-foreground">
              Track kills and deaths for each player separately (e.g., "ks
              juster" and "ks Nangiai")
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-medium text-green-600">
              ✓ PUBG/BGMI K/D Calculation
            </h3>
            <p className="text-sm text-muted-foreground">
              Follows PUBG standards: K/D = kills if deaths = 0, otherwise
              kills/deaths
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-medium text-green-600">
              ✓ Player Participation Tracking
            </h3>
            <p className="text-sm text-muted-foreground">
              Track which players participated in each match for accurate K/D
              calculations
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-medium text-green-600">
              ✓ Sequential Match Editing
            </h3>
            <p className="text-sm text-muted-foreground">
              Edit individual player stats directly from the sequential edit
              modal
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-medium text-green-600">
              ✓ Comprehensive Dashboard
            </h3>
            <p className="text-sm text-muted-foreground">
              View team and player statistics with K/D rankings and match
              history
            </p>
          </div>
        </div>
      </Card>

      {/* Sample Teams */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sampleTeams.map((team) => (
          <Card key={team.id} className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{team.teamName}</h3>
              <Badge variant="secondary" className="text-lg font-bold">
                {getTeamKD(team)} K/D
              </Badge>
            </div>

            <div className="space-y-3">
              {team.players.map((player, index) => {
                const stats = getPlayerStats(player, index, team.matchScores);
                return (
                  <div
                    key={player.ign}
                    className="flex items-center justify-between p-2 bg-muted/50 rounded"
                  >
                    <span className="font-medium">{player.ign}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-green-600">
                        {stats.totalKills}K
                      </span>
                      <span className="text-sm text-red-600">
                        {stats.totalDeaths}D
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {stats.overallKD} K/D
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>

            <Button
              onClick={() => handleEditKD(team)}
              className="w-full mt-4"
              variant="outline"
            >
              Edit Player K/D Stats
            </Button>
          </Card>
        ))}
      </div>

      {/* K/D Dashboard */}
      <TeamKDDashboard
        teams={sampleTeams}
        onUpdatePlayerStats={(
          teamId,
          matchNumber,
          playerKills,
          playerDeaths
        ) => {
          console.log("Update player stats:", {
            teamId,
            matchNumber,
            playerKills,
            playerDeaths,
          });
        }}
      />

      {/* Player K/D Edit Modal */}
      {selectedTeam && (
        <PlayerKDEditModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedTeam(null);
          }}
          onSave={handleSaveKD}
          teamName={selectedTeam.teamName}
          players={selectedTeam.players}
          initialPlayerKills={
            selectedTeam.matchScores?.["1"]?.playerKills?.map((k: number) =>
              k.toString()
            ) || []
          }
          initialPlayerDeaths={
            selectedTeam.matchScores?.["1"]?.playerDeaths?.map((d: number) =>
              d.toString()
            ) || []
          }
          initialPlayerParticipation={
            selectedTeam.matchScores?.["1"]?.playerParticipation || []
          }
          matchNumber="1"
        />
      )}
    </div>
  );
}
