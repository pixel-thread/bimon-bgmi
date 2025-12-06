import { useState } from "react";

import TwoColumnTable, { type ITeamStats } from "./TwoColumnTable";
import { formatDateDDMMYYYY } from "@/src/utils/dateFormat";
import { useMatchStore } from "../store/match/useMatchStore";
import { useSeasonStore } from "../store/season";
import { useGetSeasons } from "../hooks/season/useGetSeasons";
import { useMatches } from "../hooks/match/useMatches";

import { TeamT } from "../types/team";
import { LoaderFive } from "./ui/loader";

interface ShareableContentProps {
  teams: TeamT[];
  backgroundImage: string;
  tournamentTitle: string;
  maxMatchNumber: number; // This now represents our local matchCount
  isLoading?: boolean;
}

export function ShareableContent({
  teams,
  backgroundImage,
  tournamentTitle,
  isLoading,
}: ShareableContentProps) {
  const { matchId: selectedMatch, matchNumber } = useMatchStore();
  const { seasonId: selectedSeason } = useSeasonStore();
  const { data: seasons } = useGetSeasons();
  const { data: matches } = useMatches();
  const selectedSeasonName =
    seasons?.find((s: any) => s.id === selectedSeason)?.name || "";
  // Determine heading based on selected match
  const isOverall = selectedMatch === "all" || !selectedMatch;
  const matchIndex = isOverall
    ? -1
    : (matches?.findIndex((m: any) => m.id === selectedMatch) ?? -1);
  const derivedMatchNumber = matchIndex >= 0 ? matchIndex + 1 : null;
  const displayMatchNumber = isOverall ? null : (matchNumber ?? derivedMatchNumber);

  // Example usage:
  const todayFormatted = formatDateDDMMYYYY(new Date());

  // Normalize teams into the minimal table shape expected by TwoColumnTable
  const normalizedTeams: ITeamStats[] = (teams || []).map((t: any) => ({
    // prefer API teamId if present
    teamId: t.teamId ?? t.id,
    id: t.id ?? String(t.teamId ?? ""),
    name: t.name,
    kills: t.kills ?? 0,
    position: t.position ?? 0,
    total: t.total ?? 0,
    matches: t.matches ?? 0,
    pts: t.pts ?? 0,
    wins: t.wins ?? 0,
    players: (t.players || []).map((p: any) => ({ id: p.id, name: p.name })),
  }));

  if (isLoading) {
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
          </div>
          <div className="flex text-white justify-center">
            <LoaderFive text="Loading..." />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      id="shareable-content"
      className="relative w-full min-h-screen flex items-center justify-center bg-cover bg-center bg-background text-foreground"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <style jsx global>{`
        /* Force desktop table for sharing */
        #shareable-content.force-desktop .mobile-list { display: none !important; }
        #shareable-content.force-desktop .desktop-table { display: block !important; }

        /* Marquee on hover for long single-line names */
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-100%); }
        }
        #shareable-content .marquee-on-hover:hover .marquee-text {
          display: inline-block;
          animation: marquee 8s linear infinite;
          will-change: transform;
        }
      `}</style>
      <div className="absolute inset-0 bg-black/40" />
      <div className="modal-container relative z-10 w-full max-w-7xl 2xl:max-w-[90rem] mx-auto p-4 sm:p-6">
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
            {isOverall ? "(Overall Rankings)" : `Match ${displayMatchNumber ?? ""} Results`}
          </p>
        </div>
        {/* Content Panel for contrast */}
        <div className="rounded-lg border border-border/30 bg-background/60 backdrop-blur-sm shadow-sm p-3 sm:p-4">
          <TwoColumnTable teams={normalizedTeams} />
        </div>
        <div className="text-center mt-4 text-gray-400 text-xs">
          Designed by Pixel-Thread | Generated on {todayFormatted}
        </div>
      </div>
    </div>
  );
}
