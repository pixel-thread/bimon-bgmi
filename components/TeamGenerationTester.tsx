"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { generateTeamsNew, Team } from "@/lib/teamGenerator";
import {
  mockScenarios,
  convertMockPlayersToStats,
  convertMockPlayersToPlayers,
  MockPlayerWithStats,
} from "@/mock/mockPlayerData";
import { Player } from "@/lib/types";
import { Trophy, Users, Target, Shuffle, BarChart3 } from "lucide-react";

export function TeamGenerationTester() {
  const [selectedScenario, setSelectedScenario] = useState<string>("balanced");
  const [teams, setTeams] = useState<Team[] | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedPlayers, setSelectedPlayers] = useState<Set<string>>(
    new Set()
  );
  const [showPlayerSelection, setShowPlayerSelection] = useState(false);
  const [teamSize, setTeamSize] = useState<number>(2); // Default to duo

  const currentScenario =
    mockScenarios[selectedScenario as keyof typeof mockScenarios];
  const availablePlayers = currentScenario.players;
  const activePlayers = availablePlayers.filter((player) =>
    selectedPlayers.has(player.id)
  );

  // Initialize selected players when scenario changes
  React.useEffect(() => {
    // Auto-select first 17 players by default (odd number for testing)
    const defaultSelected = new Set(
      availablePlayers.slice(0, 17).map((p) => p.id)
    );
    setSelectedPlayers(defaultSelected);
  }, [selectedScenario]);

  const handlePlayerToggle = (playerId: string) => {
    const newSelected = new Set(selectedPlayers);
    if (newSelected.has(playerId)) {
      newSelected.delete(playerId);
    } else {
      newSelected.add(playerId);
    }
    setSelectedPlayers(newSelected);
  };

  const handleSelectAll = () => {
    setSelectedPlayers(new Set(availablePlayers.map((p) => p.id)));
  };

  const handleSelectNone = () => {
    setSelectedPlayers(new Set());
  };

  const handleSelectCount = (count: number) => {
    const selected = new Set(availablePlayers.slice(0, count).map((p) => p.id));
    setSelectedPlayers(selected);
  };

  const handleGenerateTeams = async () => {
    if (activePlayers.length < 2) {
      alert("Please select at least 2 players to generate teams.");
      return;
    }

    setIsGenerating(true);

    try {
      const mockPlayers = activePlayers as MockPlayerWithStats[]; // Use only selected players
      const regularPlayers = convertMockPlayersToPlayers(mockPlayers);
      const playerStats = convertMockPlayersToStats(mockPlayers);

      // Generate teams using original method
      const playersByCategory = {
        ultraNoobs: regularPlayers.filter((p) => p.category === "Ultra Noob"),
        noobs: regularPlayers.filter((p) => p.category === "Noob"),
        pros: regularPlayers.filter((p) => p.category === "Pro"),
        ultraPros: regularPlayers.filter((p) => p.category === "Ultra Pro"),
      };

      const result = generateTeamsNew(
        playersByCategory.ultraNoobs.map((p) => p.id),
        playersByCategory.noobs.map((p) => p.id),
        playersByCategory.pros.map((p) => p.id),
        playersByCategory.ultraPros.map((p) => p.id),
        playersByCategory,
        teamSize
      );

      setTeams(result);
    } catch (error) {
      console.error("Error generating teams:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const getPlayerSkillDisplay = (player: any) => {
    return `${player.kdRatio || 0} K/D | ${(player.winRate || 0) * 100}% WR`;
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Ultra Pro":
        return "bg-pink-100 text-pink-900 border-pink-200";
      case "Pro":
        return "bg-yellow-100 text-yellow-900 border-yellow-200";
      case "Noob":
        return "bg-green-100 text-green-900 border-green-200";
      case "Ultra Noob":
        return "bg-purple-100 text-purple-900 border-purple-200";
      default:
        return "bg-gray-100 text-gray-900 border-gray-200";
    }
  };

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-6 h-6" />
            Team Generation Testing Lab
          </CardTitle>
          <p className="text-muted-foreground">
            Test and compare traditional vs balanced team generation methods
            with mock data
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">
                Test Scenario
              </label>
              <Select
                value={selectedScenario}
                onValueChange={setSelectedScenario}
              >
                <SelectTrigger className="w-full sm:w-[300px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(mockScenarios).map(([key, scenario]) => (
                    <SelectItem key={key} value={key}>
                      <div>
                        <div className="font-medium">{scenario.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {scenario.description}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">
                Team Size
              </label>
              <Select
                value={teamSize.toString()}
                onValueChange={(value) => setTeamSize(parseInt(value))}
              >
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">
                    <div>
                      <div className="font-medium">Solo</div>
                      <div className="text-xs text-muted-foreground">
                        Individual players
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="2">
                    <div>
                      <div className="font-medium">Duo</div>
                      <div className="text-xs text-muted-foreground">
                        Pairs of two players
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="3">
                    <div>
                      <div className="font-medium">Trio</div>
                      <div className="text-xs text-muted-foreground">
                        Teams of three players
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="4">
                    <div>
                      <div className="font-medium">Squad</div>
                      <div className="text-xs text-muted-foreground">
                        Teams of four players
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleGenerateTeams}
              disabled={isGenerating}
              className="flex items-center gap-2"
            >
              <Shuffle className="w-4 h-4" />
              {isGenerating ? "Generating..." : "Generate Teams"}
            </Button>
          </div>

          {/* Player Selection Controls */}
          <Card className="bg-muted/30">
            <CardContent className="pt-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPlayerSelection(!showPlayerSelection)}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    {showPlayerSelection ? "Hide" : "Show"} Player Selection
                  </Button>
                  <Badge variant="secondary">
                    {activePlayers.length} Selected
                  </Badge>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSelectCount(16)}
                  >
                    Select 16
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSelectCount(17)}
                  >
                    Select 17
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSelectCount(20)}
                  >
                    Select 20
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleSelectAll}>
                    Select All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectNone}
                  >
                    Clear All
                  </Button>
                </div>
              </div>

              {/* Selected Players Overview */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {activePlayers.length}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Selected Players
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-pink-600">
                    {
                      activePlayers.filter((p) => p.category === "Ultra Pro")
                        .length
                    }
                  </div>
                  <div className="text-sm text-muted-foreground">Ultra Pro</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {activePlayers.filter((p) => p.category === "Pro").length}
                  </div>
                  <div className="text-sm text-muted-foreground">Pro</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {activePlayers.filter((p) => p.category === "Noob").length +
                      activePlayers.filter((p) => p.category === "Ultra Noob")
                        .length}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Noob/Ultra Noob
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      {/* Player Selection List */}
      {showPlayerSelection && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Player Selection ({currentScenario.name})
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Select which players will participate in this tournament
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {availablePlayers.map((player, index) => {
                const isSelected = selectedPlayers.has(player.id);
                return (
                  <div
                    key={player.id}
                    className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all cursor-pointer ${
                      isSelected
                        ? "bg-green-50 border-green-200 shadow-sm"
                        : "bg-muted/30 border-transparent hover:border-muted-foreground/20"
                    }`}
                    onClick={() => handlePlayerToggle(player.id)}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handlePlayerToggle(player.id)}
                        className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                      />
                      <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <div
                          className={`font-medium ${
                            isSelected ? "text-green-900" : ""
                          }`}
                        >
                          {player.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {getPlayerSkillDisplay(player as MockPlayerWithStats)}
                        </div>
                      </div>
                    </div>
                    <Badge className={getCategoryColor(player.category)}>
                      {player.category}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selected Players Summary (when selection is hidden) */}
      {!showPlayerSelection && activePlayers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Selected Players ({activePlayers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {activePlayers.map((player, index) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-green-900">
                        {player.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {getPlayerSkillDisplay(player)}
                      </div>
                    </div>
                  </div>
                  <Badge className={getCategoryColor(player.category)}>
                    {player.category}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {teams && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-blue-600" />
              Category-Based Team Generation
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Teams generated using category-based pairing (Ultra Pro + Ultra
              Noob, etc.)
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {teams.map((team, index) => (
                <div
                  key={index}
                  className="p-3 bg-blue-50 rounded-lg border border-blue-200"
                >
                  <div className="font-medium text-blue-900">
                    {team.teamName}
                  </div>
                  <div className="text-sm text-blue-700">
                    {team.players.length === 1
                      ? "Solo Player"
                      : `${team.players.length} Players`}
                  </div>
                </div>
              ))}
              <div className="pt-2 border-t">
                <div className="text-sm text-muted-foreground">
                  Total Teams: {teams.length}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
