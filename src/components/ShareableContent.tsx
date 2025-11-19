import { useState } from "react";

import TwoColumnTable from "./TwoColumnTable";
import { formatDateDDMMYYYY } from "@/src/utils/dateFormat";
import { useMatchStore } from "../store/match/useMatchStore";
import { useSeasonStore } from "../store/season";
import { useGetSeasons } from "../hooks/season/useGetSeasons";
import { useMatches } from "../hooks/match/useMatches";

import { TeamT } from "../types/team";

interface ShareableContentProps {
  teams: TeamT[];
  backgroundImage: string;
  tournamentTitle: string;
  maxMatchNumber: number; // This now represents our local matchCount
}

export function ShareableContent({
  teams,
  backgroundImage,
  tournamentTitle,
}: ShareableContentProps) {
  const { matchId: selectedMatch } = useMatchStore();
  const { seasonId: selectedSeason } = useSeasonStore();
  const { data: seasons } = useGetSeasons();
  const { data: matches } = useMatches();
  const selectedSeasonName =
    seasons?.find((s: any) => s.id === selectedSeason)?.name || "";
  const selectedMatchName =
    matches?.find((m: any) => m.id === selectedMatch)?.name || "";

  // Example usage:
  const todayFormatted = formatDateDDMMYYYY(new Date());

  return (
    <div
      id="shareable-content"
      className="relative w-full min-h-screen flex items-center justify-center bg-cover bg-center bg-background text-foreground"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <div className="absolute inset-0 bg-black/70" />
      <div className="modal-container relative z-10 w-full max-w-[98%] sm:max-w-none mx-auto p-4 sm:p-6">
        <div className="text-center mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-3xl md:text-4xl font-bold text-orange-500 font-montserrat tracking-wide">
            {tournamentTitle}
          </h1>
          {selectedSeasonName && (
            <p className="text-sm sm:text-base text-blue-400 font-semibold mt-1">
              {selectedSeasonName}
            </p>
          )}
          <p className="text-sm sm:text-md text-gray-300 mt-1">
            {selectedMatch === "All"
              ? "(Overall Rankings)"
              : `Match ${selectedMatchName} Results`}
          </p>
        </div>
        {/* Desktop Table */}
        <div className="">
          <TwoColumnTable teams={teams} />
        </div>
        <div className="text-center mt-4 text-gray-400 text-xs">
          Designed by Pixel-Thread | Generated on {todayFormatted}
        </div>
      </div>
    </div>
  );
}
