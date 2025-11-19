"use client";

import { motion, AnimatePresence } from "framer-motion";
import { PlayerCard } from "./PlayerCard";
import { TournamentT } from "@/src/types/tournament";
import { PlayerT } from "@/src/types/player";
import { usePlayers } from "@/src/hooks/player/usePlayers";

interface PlayerGridProps {
  players: PlayerT[];
  selectedPlayers: string[];
  selectedSoloPlayers: string[];
  excludedFromDeduction: Set<string>;
  activeTab: "ultraNoobs" | "noobs" | "pros" | "ultraPros" | "solo";
  tournaments: TournamentT[];
  searchQuery: string;
  onPlayerSelect: (playerId: string) => void;
  onToggleExclusion: (playerId: string) => void;
}

export function PlayerGrid({
  selectedPlayers,
  selectedSoloPlayers,
  excludedFromDeduction,
  activeTab,
  tournaments,
  searchQuery,
  onPlayerSelect,
  onToggleExclusion,
}: PlayerGridProps) {
  const { data: players } = usePlayers();
  if (players?.length === 0) {
    if (activeTab === "solo" && !searchQuery) {
      return (
        <motion.div
          key="solo-empty-state"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex flex-col items-center justify-center py-8 text-center"
        >
          <div className="text-4xl mb-3">👤</div>
          <h3 className="text-lg font-medium text-muted-foreground mb-2">
            No Solo Players Yet
          </h3>
          <p className="text-sm text-muted-foreground max-w-md">
            Search for players above to add them to solo play. Solo players will
            compete individually instead of in teams.
          </p>
        </motion.div>
      );
    }

    if (searchQuery) {
      return (
        <motion.div
          key="search-empty"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex flex-col items-center justify-center py-8 text-center"
        >
          <div className="text-4xl mb-3">🔍</div>
          <h3 className="text-lg font-medium text-muted-foreground mb-2">
            No Players Found
          </h3>
          <p className="text-sm text-muted-foreground">
            No players match "{searchQuery}". Try a different search term.
          </p>
        </motion.div>
      );
    }
  }

  return (
    <AnimatePresence>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3 max-h-[450px] sm:max-h-[400px] overflow-y-auto">
        {players?.map((player) => {
          const isSelected = selectedPlayers.includes(player.id);
          const isSolo = selectedSoloPlayers.includes(player.id);
          const isDisabled = isSolo && activeTab !== "solo";

          return (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <PlayerCard
                // @ts-ignore
                player={player}
                isSelected={isSelected}
                isDisabled={isDisabled}
                isSolo={isSolo}
                excludedFromDeduction={excludedFromDeduction.has(player.id)}
                activeTab={activeTab}
                tournaments={tournaments}
                onSelect={() => onPlayerSelect(player.id)}
                onToggleExclusion={() => onToggleExclusion(player.id)}
              />
            </motion.div>
          );
        })}
      </div>
    </AnimatePresence>
  );
}
