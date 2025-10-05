import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CombinedTeamData } from "@/lib/types";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { FiAlertCircle } from "react-icons/fi";
import { Target, UserCheck, UserX } from "lucide-react";
import TeamScoreInputs from "./TeamScoreInputs";
import React from "react";

interface TeamScoreRowProps {
  team: CombinedTeamData;
  index: number;
  tempEdits: {
    [teamId: string]: { placement?: string; kills?: string; teamName?: string; playerKills?: string[]; playerParticipation?: boolean[] };
  };
  placementErrors: { [teamId: string]: string };
  handleSetTempEdit: (teamId: string, field: "placement" | "kills" | "playerKills" | "playerParticipation", value: string | string[] | boolean[]) => void;
  searchTerm?: string;
  sequentialMatch: string;
  showPlayerKills?: boolean;
}

function highlightText(text: string, search: string): React.ReactNode {
  if (!search) return text;
  
  const regex = new RegExp(`(${search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, "gi");
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? (
      <span
        key={i}
        className="bg-green-200 dark:bg-yellow-300 dark:text-black rounded px-0.5 font-medium search-highlight"
        ref={(el) => {
          if (el && i === 1) {
            setTimeout(() => {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
          }
        }}
      >
        {part}
      </span>
    ) : (
      part
    )
  );
}

const getPositionFromPoints = (points: number) => {
  const placementMap = [10, 6, 5, 4, 3, 2, 1, 1, 0];
  const index = placementMap.lastIndexOf(points);
  return index !== -1 ? index + 1 : 0;
};

export default function TeamScoreRow({
  team,
  index,
  tempEdits,
  placementErrors,
  handleSetTempEdit,
  searchTerm = "",
  sequentialMatch,
  showPlayerKills = false,
}: TeamScoreRowProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const teamEdits = tempEdits[team.id];
  const displayName = teamEdits?.teamName || team.teamName;
  const hasError = !!placementErrors[team.id];
  const isMobile = typeof window !== "undefined" && window.innerWidth < 640;

  const matchScore = team.matchScores?.[sequentialMatch] || { kills: 0, placementPoints: 0, playerKills: [] };
  const savedPlacement =
    matchScore.placementPoints > 0 ? String(getPositionFromPoints(matchScore.placementPoints)) : "0";
  const savedKills = matchScore.kills > 0 ? String(matchScore.kills) : "0";
  
  const placementValue = teamEdits?.placement ? teamEdits.placement.replace(/^0+/, "") : savedPlacement.replace(/^0+/, "");
  const killsValue = teamEdits?.kills ? teamEdits.kills.replace(/^0+/, "") : savedKills.replace(/^0+/, "");

  const playerKills = teamEdits?.playerKills || matchScore.playerKills?.map(k => k.toString()) || [];
  const playerParticipation = teamEdits?.playerParticipation || 
    (matchScore as any).playerParticipation || 
    team.players.map(() => true);

  const hasPlayerKDData = playerKills.some(k => k !== "" && k !== "0");

  // Split team name by underscore to get individual player names
  const playerNames = team.teamName.split("_");

  const handlePlayerKillsChange = (playerKills: string[]) => {
    handleSetTempEdit(team.id, "playerKills", playerKills);
    const totalKills = playerKills.reduce((sum, k) => sum + (parseInt(k) || 0), 0);
    handleSetTempEdit(team.id, "kills", totalKills.toString());
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <>
      <div
        className="grid grid-cols-[auto_56px_56px_40px] sm:grid-cols-[auto_100px_70px_50px] gap-1 sm:gap-2 py-1.5 sm:py-2 px-1 sm:px-2 border-b border-border items-center"
      >
        <div className="text-sm sm:text-base text-foreground truncate">
          {searchTerm ? highlightText(displayName, searchTerm) : displayName}
        </div>
        
        <div className="relative w-14 sm:w-16 min-w-0">
          <Input
            type="number"
            value={placementValue}
            onChange={e => handleSetTempEdit(team.id, "placement", e.target.value)}
            placeholder={isMobile ? "" : "Pos"}
            aria-label={`Position for ${displayName}`}
            className={`w-full h-9 sm:h-10 text-center rounded-[var(--radius-sm)] border ${hasError ? "border-destructive" : "border-input dark:border-white"} focus:ring-2 focus:ring-primary transition-all text-base sm:text-lg py-1 px-2 no-spinner touch-pinch-zoom-none`}
            inputMode="numeric"
            pattern="[0-9]*"
            style={{ MozAppearance: 'textfield' }}
            onWheel={e => (e.target as HTMLInputElement).blur()}
            onKeyDown={e => (e.key === 'ArrowUp' || e.key === 'ArrowDown') && e.preventDefault()}
          />
          {hasError && (
            <FiAlertCircle className="absolute right-1.5 top-1/2 -translate-y-1/2 text-destructive h-4 sm:h-5 w-4 sm:w-5" />
          )}
        </div>

        <div className="relative w-14 sm:w-16 min-w-0">
          <div className="w-full h-9 sm:h-10 text-center rounded-[var(--radius-sm)] text-base sm:text-lg py-1 px-2 bg-background text-foreground flex items-center justify-center">
            {killsValue}
          </div>
        </div>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={hasPlayerKDData ? "default" : "outline"}
                size="sm"
                onClick={toggleExpanded}
                className={`w-10 h-9 sm:w-12 sm:h-10 p-0 ${hasPlayerKDData ? "bg-green-600 hover:bg-green-700" : ""}`}
                aria-label={`${isExpanded ? 'Hide' : 'Show'} player kills for ${displayName}`}
              >
                <Target className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isExpanded ? 'Hide' : 'Show'} individual player kills</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      {isExpanded && team.players && team.players.length > 0 && (
        <div className="col-span-4 px-2 py-2 bg-muted/30 border-t">
          <div className="text-xs text-muted-foreground mb-2">Individual Player Performance:</div>
          <div className="grid grid-cols-1 gap-2">
            {team.players.map((player, playerIndex) => {
              const participated = playerParticipation[playerIndex] !== undefined ? playerParticipation[playerIndex] : true;
              // Use the split player name as placeholder, fallback to player.ign if not enough names
              const placeholderName = playerNames[playerIndex] || player.ign;
              return (
                <div key={player.ign} className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Checkbox
                      checked={participated}
                      onCheckedChange={(checked) => {
                        const newParticipation = [...playerParticipation];
                        while (newParticipation.length <= playerIndex) {
                          newParticipation.push(true);
                        }
                        newParticipation[playerIndex] = checked === true;
                        handleSetTempEdit(team.id, "playerParticipation", newParticipation);
                        
                        if (!checked) {
                          const newPlayerKills = [...playerKills];
                          while (newPlayerKills.length <= playerIndex) {
                            newPlayerKills.push("");
                          }
                          newPlayerKills[playerIndex] = "0";
                          handlePlayerKillsChange(newPlayerKills);
                        }
                      }}
                      className="h-4 w-4"
                    />
                    {participated ? (
                      <UserCheck className="h-3 w-3 text-green-600" />
                    ) : (
                      <UserX className="h-3 w-3 text-red-500" />
                    )}
                  </div>
                  
                  <span className={`text-xs font-medium truncate flex-1 ${!participated ? 'text-muted-foreground line-through' : ''}`}>
                    {player.ign}
                  </span>
                  
                  <Input
                    type="number"
                    value={playerKills[playerIndex] || ""}
                    onChange={e => {
                      const newPlayerKills = [...playerKills];
                      while (newPlayerKills.length <= playerIndex) {
                        newPlayerKills.push("");
                      }
                      newPlayerKills[playerIndex] = e.target.value;
                      handlePlayerKillsChange(newPlayerKills);
                    }}
                    min="0"
                    max="99"
                    disabled={!participated}
                    className={`w-12 h-7 text-xs text-center ${!participated ? 'opacity-50' : ''}`}
                    placeholder={placeholderName} // Use split player name as placeholder
                    inputMode="numeric"
                    pattern="[0-9]*"
                    style={{ MozAppearance: 'textfield' }}
                    onWheel={e => (e.target as HTMLInputElement).blur()}
                    onKeyDown={e => (e.key === 'ArrowUp' || e.key === 'ArrowDown') && e.preventDefault()}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}