"use client";

import { Button } from "@/src/components/ui/button";
import { FiPlus } from "react-icons/fi";
import TournamentSelector from "@/src/components/TournamentSelector";
import { SeasonSelector } from "./SeasonSelector";

interface TournamentToolbarProps {
  selectedTournament: string | null;
  setSelectedTournament: (id: string | null) => void;
  setShowCreateModal: (show: boolean) => void;
  setShowBulkCreateModal: (show: boolean) => void;
  selectedSeason: string;
  setSelectedSeason: (season: string) => void;
  tournaments: any[];
}

export default function TournamentToolbar({
  selectedTournament,
  setSelectedTournament,
  setShowCreateModal,
  setShowBulkCreateModal,
  selectedSeason,
  setSelectedSeason,
  tournaments,
}: TournamentToolbarProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <SeasonSelector
          selectedSeason={selectedSeason}
          onSeasonChange={setSelectedSeason}
          size="sm"
          variant="green"
          placeholder="Season"
          showAllSeasons={true}
          className="w-full"
        />
        <TournamentSelector
          selected={selectedTournament}
          onSelect={setSelectedTournament}
          tournaments={tournaments}
          className="w-full"
        />
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
          disabled={!selectedTournament}
          className="h-8 text-xs gap-1 bg-muted/50 hover:bg-muted"
        >
          <FiPlus className="h-3 w-3" />
          Bulk Teams
        </Button>
      </div>
    </div>
  );
}
