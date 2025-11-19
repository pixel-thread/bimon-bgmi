import { useMatchStore } from "@/src/store/match/useMatchStore";
import { TeamT } from "@/src/types/team";
import { motion } from "framer-motion";

interface TeamCardProps {
  team: TeamT;
  searchTerm: string;
  selectedMatch: string;
  onClick?: () => void;
  onDelete?: () => Promise<void>;
  position?: number;
  readOnly?: boolean;
}

export default function TeamCard({ team }: TeamCardProps) {
  const { matchId: selectedMatch } = useMatchStore();
  const totalKills = team.kills;

  const matchScores = totalKills;

  const position = team.position;

  const totalScore = team.total;

  const displayName = team.name;

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
      </div>

      <div className="p-3 sm:p-4 space-y-2">
        {team?.players && (
          <p className="text-xs sm:text-sm text-muted-foreground truncate">
            <span className="font-medium text-foreground">Players:</span>{" "}
            {team?.players?.map((p) => p.name).join(", ")}
          </p>
        )}

        {selectedMatch === "All" ? (
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2">
            <div className="px-2 py-1 rounded-full text-xs font-medium bg-accent text-accent-foreground">
              Total Points:{" "}
              {Object.values(matchScores).reduce(
                (acc, s) => acc + (s.kills || 0) + (s.total || 0),
                0,
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
            <div className={`px-2 py-1 rounded-full text-xs font-medium`}>
              Placement Points: {team.pts}
            </div>
            <div className={`px-2 py-1 rounded-full text-xs font-medium`}>
              Kills: {team.kills}
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
