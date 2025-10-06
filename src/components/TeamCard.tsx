import { CombinedTeamData } from "@/src/lib/types";
import { Button } from "@/src/components/ui/button";
import { FiEdit, FiTrash2 } from "react-icons/fi";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";
import { motion } from "framer-motion";

interface TeamCardProps {
  team: CombinedTeamData;
  searchTerm: string;
  selectedMatch: string;
  onClick?: () => void;
  onDelete?: () => Promise<void>;
  tempEdits: {
    [teamId: string]: {
      placement?: string;
      kills?: string;
      playerKills?: string[];
      teamName?: string;
    };
  };
  onTempEditChange?: (
    teamId: string,
    field: "placement" | "kills" | "teamName",
    value: string
  ) => void;
  position?: number;
  readOnly?: boolean;
}

export default function TeamCard({
  team,
  searchTerm,
  selectedMatch,
  onClick,
  onDelete,
  tempEdits,
  position,
  readOnly = false,
  onTempEditChange,
}: TeamCardProps) {
  const matchScores = team.matchScores || {};
  const score = matchScores[selectedMatch] || {
    kills: 0,
    placementPoints: 0,
    playerKills: [],
  };
  const totalScore = score.kills + score.placementPoints;
  const displayName = tempEdits[team.id]?.teamName || team.teamName;

  // Color-coded badges
  const placementColor =
    score.placementPoints >= 6
      ? "bg-green-100 text-green-800"
      : score.placementPoints >= 3
      ? "bg-yellow-100 text-yellow-800"
      : "bg-gray-100 text-gray-800";

  const killsColor =
    score.kills > 5
      ? "bg-red-100 text-red-800"
      : score.kills > 0
      ? "bg-blue-100 text-blue-800"
      : "bg-gray-100 text-gray-800";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.3 }}
      className="rounded-lg shadow-md bg-background dark:bg-black text-foreground hover:shadow-lg transition-shadow border border-gray-200 dark:border-white/20 w-full max-w-md mx-auto"
    >
      <div className="p-3 sm:p-4 border-none flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm sm:text-base font-semibold text-foreground truncate max-w-[10rem] sm:max-w-[12rem]">
            {displayName}
          </h3>
        </div>
        <TooltipProvider>
          <div className="flex gap-2 justify-end">
            {!readOnly && onClick && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onClick}
                    className="hover:bg-accent transition-colors min-w-[2.5rem] h-8 sm:h-9"
                    aria-label={`Edit details for ${team.teamName}`}
                  >
                    <FiEdit className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Edit team details</TooltipContent>
              </Tooltip>
            )}
            {!readOnly && onDelete && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onDelete}
                    className="text-destructive border-none hover:bg-destructive/10 hover:text-destructive transition-colors min-w-[2.5rem] h-8 sm:h-9"
                    aria-label={`Delete ${team.teamName}`}
                  >
                    <FiTrash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Delete team</TooltipContent>
              </Tooltip>
            )}
          </div>
        </TooltipProvider>
      </div>

      <div className="p-3 sm:p-4 space-y-2">
        {team.duoPlayers ? (
          <p className="text-xs sm:text-sm text-muted-foreground truncate">
            <span className="font-medium text-foreground">Players:</span>{" "}
            {team.duoPlayers[0].name} (Noob), {team.duoPlayers[1].name} (Pro)
          </p>
        ) : (
          <p className="text-xs sm:text-sm text-muted-foreground truncate">
            <span className="font-medium text-foreground">Players:</span>{" "}
            {team.players.map((p) => p.ign).join(", ")}
          </p>
        )}
        {selectedMatch === "All" ? (
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2">
            <div className="px-2 py-1 rounded-full text-xs font-medium bg-accent text-accent-foreground">
              Total Points:{" "}
              {Object.values(matchScores).reduce(
                (acc, s) => acc + (s.kills || 0) + (s.placementPoints || 0),
                0
              )}
            </div>
            <div
              className={`px-2 py-1 rounded-full text-xs font-medium ${
                position === 1
                  ? "bg-yellow-300 text-yellow-900"
                  : position === 2
                  ? "bg-gray-300 text-gray-900"
                  : position === 3
                  ? "bg-orange-300 text-orange-900"
                  : "bg-accent text-accent-foreground"
              }`}
            >
              Overall Position: {position !== undefined ? position : "-"}
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2">
            <div
              className={`px-2 py-1 rounded-full text-xs font-medium ${placementColor}`}
            >
              Placement: {score.placementPoints}
            </div>
            <div
              className={`px-2 py-1 rounded-full text-xs font-medium ${killsColor}`}
            >
              Kills: {score.kills}
            </div>
            <div className="text-xs sm:text-sm font-medium text-foreground ml-auto">
              Total: {totalScore}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
