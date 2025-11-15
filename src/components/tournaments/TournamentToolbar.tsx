"use client";

import { Button } from "@/src/components/ui/button";
import { useTournamentStore } from "@/src/store/tournament";
import { FiPlus } from "react-icons/fi";

interface TournamentToolbarProps {
  setShowCreateModal: (show: boolean) => void;
  setShowBulkCreateModal: (show: boolean) => void;
}

export default function TournamentToolbar({
  setShowCreateModal,
}: TournamentToolbarProps) {
  const { tournamentId } = useTournamentStore();
  return (
    <div className="flex flex-row gap-2">
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
      </div>
      {tournamentId && (
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            onClick={() => setShowCreateModal(true)}
            className="h-8 text-xs gap-1 bg-muted/50 hover:bg-muted"
          >
            Declare Winner
          </Button>
        </div>
      )}
    </div>
  );
}
