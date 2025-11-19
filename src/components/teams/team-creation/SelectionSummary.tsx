"use client";

import { TeamMode } from "./types";

interface SelectionSummaryProps {
  totalSelectedPlayers: number;
  selectedSoloPlayers: number;
  teamMode: TeamMode;
}

export function SelectionSummary({
  totalSelectedPlayers,
  selectedSoloPlayers,
  teamMode,
}: SelectionSummaryProps) {
  return (
    <div className="flex-1 max-w-[280px] sm:max-w-[320px]">
      <div
        className={`grid ${
          selectedSoloPlayers > 0 ? "grid-cols-2" : "grid-cols-1"
        } gap-1 sm:gap-1.5`}
      >
        <div className="bg-card p-1 rounded-md border text-center">
          <div className="text-sm font-semibold text-primary">
            {totalSelectedPlayers}
          </div>
          <div className="text-[10px] text-muted-foreground">Players</div>
        </div>
        {selectedSoloPlayers > 0 && (
          <div className="bg-card p-1 rounded-md border text-center">
            <div className="text-sm font-semibold text-primary">
              {selectedSoloPlayers}
            </div>
            <div className="text-[10px] text-muted-foreground">
              Solo {selectedSoloPlayers !== 1 ? "Players" : "Player"}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}