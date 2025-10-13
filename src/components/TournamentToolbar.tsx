"use client";

import { Button } from "@/src/components/ui/button";
import { FiPlus } from "react-icons/fi";
import TournamentSelector from "@/src/components/TournamentSelector";
import { SeasonSelector } from "./SeasonSelector";
import { useTournamentStore } from "../store/tournament";
import { useSeasonStore } from "../store/season";

interface TournamentToolbarProps {
  setShowCreateModal: (show: boolean) => void;
  setShowBulkCreateModal: (show: boolean) => void;
}

export default function TournamentToolbar({
  setShowCreateModal,
  setShowBulkCreateModal,
}: TournamentToolbarProps) {
  const { tournamentId: selectedTournament } = useTournamentStore();
  const { seasonId } = useSeasonStore();
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <SeasonSelector size="sm" showAllSeasons={true} className="w-full" />
        <TournamentSelector className="w-full" />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowCreateModal(true)}
          className="h-8 text-xs gap-1 bg-muted/50 hover:bg-muted"
        >
          <FiPlus className="h-3 w-3" />
          New Tournament
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowBulkCreateModal(true)}
          disabled={!selectedTournament || !seasonId}
          className="h-8 text-xs gap-1 bg-muted/50 hover:bg-muted"
        >
          <FiPlus className="h-3 w-3" />
          Bulk Teams
        </Button>
      </div>
    </div>
  );
}
