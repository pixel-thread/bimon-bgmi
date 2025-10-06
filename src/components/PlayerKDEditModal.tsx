import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Badge } from "@/src/components/ui/badge";
import { Checkbox } from "@/src/components/ui/checkbox";
import { calculateKD } from "@/src/lib/utils";
import { UserCheck, UserX } from "lucide-react";

interface PlayerKDEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    playerKills: string[],
    playerDeaths: string[],
    playerParticipation: boolean[]
  ) => void;
  teamName: string;
  players: { ign: string }[];
  initialPlayerKills?: string[];
  initialPlayerDeaths?: string[];
  initialPlayerParticipation?: boolean[];
  matchNumber: string;
}

export default function PlayerKDEditModal({
  isOpen,
  onClose,
  onSave,
  teamName,
  players,
  initialPlayerKills = [],
  initialPlayerDeaths = [],
  initialPlayerParticipation = [],
  matchNumber,
}: PlayerKDEditModalProps) {
  const [playerKills, setPlayerKills] = useState<string[]>([]);
  const [playerDeaths, setPlayerDeaths] = useState<string[]>([]);
  const [playerParticipation, setPlayerParticipation] = useState<boolean[]>([]);

  useEffect(() => {
    if (isOpen) {
      // Initialize with existing data or default values
      const kills = players.map((_, idx) => initialPlayerKills[idx] || "");
      const deaths = players.map((_, idx) => initialPlayerDeaths[idx] || "");
      const participation = players.map((_, idx) =>
        initialPlayerParticipation[idx] !== undefined
          ? initialPlayerParticipation[idx]
          : true
      );
      setPlayerKills(kills);
      setPlayerDeaths(deaths);
      setPlayerParticipation(participation);
    }
  }, [
    isOpen,
    players,
    initialPlayerKills,
    initialPlayerDeaths,
    initialPlayerParticipation,
  ]);

  const handleKillsChange = (playerIndex: number, value: string) => {
    const newKills = [...playerKills];
    newKills[playerIndex] = value.slice(0, 2); // Limit to 2 digits
    setPlayerKills(newKills);
  };

  const handleDeathsChange = (playerIndex: number, value: string) => {
    const newDeaths = [...playerDeaths];
    newDeaths[playerIndex] = value.slice(0, 2); // Limit to 2 digits
    setPlayerDeaths(newDeaths);
  };

  const handleParticipationChange = (
    playerIndex: number,
    participated: boolean
  ) => {
    const newParticipation = [...playerParticipation];
    newParticipation[playerIndex] = participated;
    setPlayerParticipation(newParticipation);

    // If player didn't participate, reset their kills and deaths to 0
    if (!participated) {
      const newKills = [...playerKills];
      const newDeaths = [...playerDeaths];
      newKills[playerIndex] = "0";
      newDeaths[playerIndex] = "0";
      setPlayerKills(newKills);
      setPlayerDeaths(newDeaths);
    }
  };

  const calculatePlayerKD = (kills: string, deaths: string): number => {
    const k = parseInt(kills) || 0;
    const d = parseInt(deaths) || 0;
    return calculateKD(k, d);
  };

  const getTotalKills = (): number => {
    return playerKills.reduce((sum, kills) => sum + (parseInt(kills) || 0), 0);
  };

  const handleSave = () => {
    onSave(playerKills, playerDeaths, playerParticipation);
    onClose();
  };

  const handleReset = () => {
    const kills = players.map(() => "");
    const deaths = players.map(() => "");
    const participation = players.map(() => true); // Default to participated
    setPlayerKills(kills);
    setPlayerDeaths(deaths);
    setPlayerParticipation(participation);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Edit Player K/D - {teamName} (Match {matchNumber})
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted/50 p-3 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Team Total Kills</span>
              <Badge variant="secondary" className="text-lg font-bold">
                {getTotalKills()}
              </Badge>
            </div>
          </div>

          <div className="space-y-4">
            {players.map((player, index) => {
              const kd = calculatePlayerKD(
                playerKills[index] || "",
                playerDeaths[index] || ""
              );

              return (
                <div
                  key={player.ign}
                  className={`border rounded-lg p-4 space-y-3 ${
                    !playerParticipation[index] ? "opacity-60 bg-muted/30" : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`participation-${index}`}
                          checked={playerParticipation[index] || false}
                          onCheckedChange={(checked) =>
                            handleParticipationChange(index, checked as boolean)
                          }
                        />
                        <Label
                          htmlFor={`participation-${index}`}
                          className="text-sm font-medium cursor-pointer"
                        >
                          {playerParticipation[index] ? (
                            <div className="flex items-center gap-1 text-green-600">
                              <UserCheck className="w-4 h-4" />
                              Participated
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-red-600">
                              <UserX className="w-4 h-4" />
                              Did not play
                            </div>
                          )}
                        </Label>
                      </div>
                      <h4 className="font-medium text-lg">{player.ign}</h4>
                    </div>
                    <Badge
                      variant={
                        kd >= 2 ? "default" : kd >= 1 ? "secondary" : "outline"
                      }
                      className="text-sm font-bold"
                    >
                      {playerParticipation[index] ? `${kd} K/D` : "N/A"}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor={`kills-${index}`}
                        className="text-sm font-medium"
                      >
                        Kills
                      </Label>
                      <Input
                        id={`kills-${index}`}
                        type="number"
                        value={playerKills[index] || ""}
                        onChange={(e) =>
                          handleKillsChange(index, e.target.value)
                        }
                        min="0"
                        max="99"
                        className="text-center text-lg font-semibold"
                        placeholder="0"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        disabled={!playerParticipation[index]}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor={`deaths-${index}`}
                        className="text-sm font-medium"
                      >
                        Deaths
                      </Label>
                      <Input
                        id={`deaths-${index}`}
                        type="number"
                        value={playerDeaths[index] || ""}
                        onChange={(e) =>
                          handleDeathsChange(index, e.target.value)
                        }
                        min="0"
                        max="99"
                        className="text-center text-lg font-semibold"
                        placeholder="0"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        disabled={!playerParticipation[index]}
                      />
                    </div>
                  </div>

                  <div className="text-center text-sm text-muted-foreground">
                    {parseInt(playerKills[index] || "0")} kills,{" "}
                    {parseInt(playerDeaths[index] || "0")} deaths
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={handleReset}>
            Reset All
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Player Stats</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
