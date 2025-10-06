import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Checkbox } from "@/src/components/ui/checkbox";
import { FiAlertCircle } from "react-icons/fi";
import { UserCheck, UserX } from "lucide-react";
import React, { useEffect, useState, useCallback } from "react";
import { calculatePlayerKDs } from "@/src/lib/utils";

interface TeamScoreInputsProps {
  teamName: string;
  placement: string;
  kills: string;
  onPlacementChange: (value: string) => void;
  onKillsChange: (value: string) => void;
  error?: string;
  showPlayerKills?: boolean;
  showPlayerKD?: boolean;
  showPlayerParticipation?: boolean;
  players?: { ign: string }[];
  playerKills?: string[];
  playerParticipation?: boolean[];
  onPlayerKillsChange?: (kills: string[]) => void;
  onPlayerParticipationChange?: (participation: boolean[]) => void;
  readOnlyKills?: boolean;
  layout?: "row" | "block";
  matchesPlayed?: number; // For K/D calculation
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    setIsMobile(typeof window !== "undefined" && window.innerWidth < 640);
  }, []);
  return isMobile;
}

// Custom hook for better input selection
function useInputSelection() {
  const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    // Use setTimeout to ensure the selection happens after the focus event
    setTimeout(() => {
      (e.target as HTMLInputElement).select();
    }, 10);
  }, []);

  const handleClick = useCallback((e: React.MouseEvent<HTMLInputElement>) => {
    // Select all text when clicking on the input
    setTimeout(() => {
      e.currentTarget.select();
    }, 10);
  }, []);

  return { handleFocus, handleClick };
}

export default function TeamScoreInputs({
  teamName,
  placement,
  kills,
  onPlacementChange,
  onKillsChange,
  error,
  showPlayerKills = false,
  showPlayerKD = false,
  showPlayerParticipation = false,
  players = [],
  playerKills = [],
  playerParticipation = [],
  onPlayerKillsChange,
  onPlayerParticipationChange,
  readOnlyKills = false,
  layout = "row",
  matchesPlayed = 1,
}: TeamScoreInputsProps) {
  const isMobile = useIsMobile();
  const { handleFocus, handleClick } = useInputSelection();

  // Smart defaults: Initialize player participation with all players as participated
  useEffect(() => {
    if (
      showPlayerParticipation &&
      players &&
      players.length > 0 &&
      onPlayerParticipationChange
    ) {
      // If no participation data provided, default all to true (participated)
      if (!playerParticipation || playerParticipation.length === 0) {
        const defaultParticipation = players.map(() => true);
        onPlayerParticipationChange(defaultParticipation);
      } else {
        // For existing data, default to participated if undefined/null
        const smartDefaults = playerParticipation.map((participated) =>
          participated !== undefined ? participated : true
        );
        // Only update if there are changes to avoid infinite loops
        if (
          JSON.stringify(smartDefaults) !== JSON.stringify(playerParticipation)
        ) {
          onPlayerParticipationChange(smartDefaults);
        }
      }
    }
  }, [
    players,
    playerParticipation,
    onPlayerParticipationChange,
    showPlayerParticipation,
  ]);

  // Handler for player kills if enabled
  const handlePlayerKillsChange = (idx: number, value: string) => {
    if (!onPlayerKillsChange) return;
    const newKills = [...playerKills];
    newKills[idx] =
      value === "0" && (!playerKills[idx] || playerKills[idx] === "0")
        ? ""
        : value.slice(0, 2);
    onPlayerKillsChange(newKills);

    // Auto-update total kills based on individual player kills
    const totalKills = newKills.reduce((sum, k) => sum + (parseInt(k) || 0), 0);
    onKillsChange(totalKills.toString());
  };

  // Handler for player participation if enabled
  const handlePlayerParticipationChange = (
    idx: number,
    participated: boolean
  ) => {
    if (!onPlayerParticipationChange || !onPlayerKillsChange) return;

    const newParticipation = [...playerParticipation];
    newParticipation[idx] = participated;
    onPlayerParticipationChange(newParticipation);

    // If player didn't participate, reset their kills to 0
    if (!participated) {
      const newKills = [...playerKills];
      newKills[idx] = "0";
      onPlayerKillsChange(newKills);

      // Auto-update total kills
      const totalKills = newKills.reduce(
        (sum, k) => sum + (parseInt(k) || 0),
        0
      );
      onKillsChange(totalKills.toString());
    }
  };

  // Calculate K/D ratios for display (1 death per match automatically)
  const playerKDs = React.useMemo(() => {
    if (!showPlayerKD || !playerKills.length) return [];
    const kills = playerKills.map((k) => parseInt(k) || 0);
    return calculatePlayerKDs(kills, matchesPlayed);
  }, [playerKills, showPlayerKD, matchesPlayed]);

  if (layout === "row") {
    // Used in SequentialEditModal/TeamScoreRow
    return (
      <div className="flex items-center gap-2 justify-end">
        <div className="relative w-14 sm:w-16 min-w-0">
          <Input
            type="number"
            value={placement}
            onChange={(e) => onPlacementChange(e.target.value)}
            placeholder={isMobile ? "" : "Pos"}
            aria-label={`Position for ${teamName}`}
            className={`w-full h-9 sm:h-10 text-center rounded-[var(--radius-sm)] border ${
              error ? "border-destructive" : "border-input dark:border-white"
            } focus:ring-2 focus:ring-primary transition-all text-base sm:text-lg py-1 px-2 no-spinner touch-pinch-zoom-none`}
            inputMode="numeric"
            pattern="[0-9]*"
            style={{ MozAppearance: "textfield" }}
            onWheel={(e) => (e.target as HTMLInputElement).blur()}
            onKeyDown={(e) =>
              (e.key === "ArrowUp" || e.key === "ArrowDown") &&
              e.preventDefault()
            }
            onFocus={handleFocus}
            onClick={handleClick}
          />
          {error && (
            <FiAlertCircle className="absolute right-1.5 top-1/2 -translate-y-1/2 text-destructive h-4 sm:h-5 w-4 sm:w-5" />
          )}
        </div>
        <div className="relative w-14 sm:w-16 min-w-0">
          <Input
            type="number"
            value={kills}
            onChange={(e) => onKillsChange(e.target.value)}
            placeholder={isMobile ? "" : "Kills"}
            aria-label={`Kills for ${teamName}`}
            className={`w-full h-9 sm:h-10 text-center rounded-[var(--radius-sm)] border border-input dark:border-white focus:ring-2 focus:ring-primary transition-all text-base sm:text-lg py-1 px-2 no-spinner touch-pinch-zoom-none`}
            inputMode="numeric"
            pattern="[0-9]*"
            style={{ MozAppearance: "textfield" }}
            onWheel={(e) => (e.target as HTMLInputElement).blur()}
            onKeyDown={(e) =>
              (e.key === "ArrowUp" || e.key === "ArrowDown") &&
              e.preventDefault()
            }
            onFocus={handleFocus}
            onClick={handleClick}
            readOnly={readOnlyKills}
          />
        </div>
      </div>
    );
  }

  // Block layout for modal editing with optional player kills
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label htmlFor="placement" className="text-xs min-w-[80px]">
          Placement
        </Label>
        <Input
          id="placement"
          type="number"
          value={placement}
          onChange={(e) => onPlacementChange(e.target.value)}
          min="1"
          max="25"
          className="w-12 text-sm text-center rounded-[var(--radius-sm)] border-input dark:border-white focus:ring-2 focus:ring-primary transition-all py-1 px-2 no-spinner touch-pinch-zoom-none"
          inputMode="numeric"
          pattern="[0-9]*"
          style={{ MozAppearance: "textfield" }}
          onWheel={(e) => (e.target as HTMLInputElement).blur()}
          onKeyDown={(e) =>
            (e.key === "ArrowUp" || e.key === "ArrowDown") && e.preventDefault()
          }
          onFocus={handleFocus}
          onClick={handleClick}
          placeholder={isMobile ? "" : "Pos"}
          aria-label="Placement"
        />
        {error && <FiAlertCircle className="ml-1 text-destructive h-4 w-4" />}
      </div>
      {(showPlayerKills || showPlayerKD || showPlayerParticipation) &&
        players.length > 0 && (
          <div>
            <Label className="block text-xs mb-1">Player Stats</Label>
            <div className="space-y-2">
              {players.map((player, idx) => {
                const participated =
                  playerParticipation[idx] !== undefined
                    ? playerParticipation[idx]
                    : true;
                return (
                  <div
                    key={player.ign}
                    className={`flex items-center gap-2 p-2 rounded-lg ${
                      !participated ? "opacity-60 bg-muted/30" : ""
                    }`}
                  >
                    <Label className="text-xs min-w-[80px] truncate">
                      {player.ign}
                    </Label>

                    {showPlayerParticipation && (
                      <div className="flex flex-col items-center">
                        <Label className="text-xs text-muted-foreground mb-1">
                          Played
                        </Label>
                        <div className="flex items-center space-x-1">
                          <Checkbox
                            id={`participation-${idx}`}
                            checked={participated}
                            onCheckedChange={(checked) =>
                              handlePlayerParticipationChange(
                                idx,
                                checked as boolean
                              )
                            }
                          />
                          <Label
                            htmlFor={`participation-${idx}`}
                            className="cursor-pointer"
                          >
                            {participated ? (
                              <UserCheck className="w-3 h-3 text-green-600" />
                            ) : (
                              <UserX className="w-3 h-3 text-red-600" />
                            )}
                          </Label>
                        </div>
                      </div>
                    )}

                    {showPlayerKills && (
                      <div className="flex flex-col items-center">
                        <Label className="text-xs text-muted-foreground mb-1">
                          Kills
                        </Label>
                        <Input
                          type="number"
                          value={
                            playerKills && playerKills[idx] === "0"
                              ? ""
                              : playerKills?.[idx] || ""
                          }
                          onChange={(e) =>
                            handlePlayerKillsChange(idx, e.target.value)
                          }
                          min="0"
                          max="99"
                          className="w-12 text-sm text-center rounded-[var(--radius-sm)] border-input dark:border-white focus:ring-2 focus:ring-primary transition-all py-1 px-2 no-spinner touch-pinch-zoom-none"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          style={{ MozAppearance: "textfield" }}
                          onWheel={(e) => (e.target as HTMLInputElement).blur()}
                          onKeyDown={(e) =>
                            (e.key === "ArrowUp" || e.key === "ArrowDown") &&
                            e.preventDefault()
                          }
                          onFocus={handleFocus}
                          onClick={handleClick}
                          placeholder={isMobile ? "" : "0"}
                          aria-label={`Kills for ${player.ign}`}
                          disabled={showPlayerParticipation && !participated}
                        />
                      </div>
                    )}

                    {showPlayerKD && (
                      <div className="flex flex-col items-center">
                        <Label className="text-xs text-muted-foreground mb-1">
                          K/D
                        </Label>
                        <div className="w-12 h-8 flex items-center justify-center text-sm font-medium text-primary bg-muted rounded-[var(--radius-sm)]">
                          {participated && playerKDs[idx] !== undefined
                            ? playerKDs[idx]
                            : "N/A"}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      <div className="flex items-center gap-2 pt-2">
        <Label className="text-xs min-w-[80px] font-semibold">
          Total Kills
        </Label>
        <Input
          type="number"
          value={kills}
          onChange={(e) => onKillsChange(e.target.value)}
          className="w-12 text-sm text-center rounded-[var(--radius-sm)] border-input dark:border-white focus:ring-2 focus:ring-primary transition-all py-1 px-2 no-spinner touch-pinch-zoom-none"
          readOnly={readOnlyKills}
          inputMode="numeric"
          pattern="[0-9]*"
          style={{ MozAppearance: "textfield" }}
          onWheel={(e) => (e.target as HTMLInputElement).blur()}
          onKeyDown={(e) =>
            (e.key === "ArrowUp" || e.key === "ArrowDown") && e.preventDefault()
          }
          onFocus={handleFocus}
          onClick={handleClick}
          placeholder={isMobile ? "" : "Kills"}
        />
      </div>
    </div>
  );
}
