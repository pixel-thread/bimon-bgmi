import { useState } from "react";

import TwoColumnTable, { type ITeamStats } from "./TwoColumnTable";
import { formatDateDDMMYYYY } from "@/src/utils/dateFormat";
import { useMatchStore } from "../store/match/useMatchStore";
import { useSeasonStore } from "../store/season";
import { useGetSeasons } from "../hooks/season/useGetSeasons";
import { useMatches } from "../hooks/match/useMatches";
import { Calendar, Trophy, Gamepad2 } from "lucide-react";

import { TeamT } from "../types/team";
import { LoaderFive } from "./ui/loader";

interface ShareableContentProps {
  teams: TeamT[];
  backgroundImage: string;
  tournamentTitle: string;
  maxMatchNumber: number;
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

  const todayFormatted = formatDateDDMMYYYY(new Date());

  // Normalize teams into the minimal table shape expected by TwoColumnTable
  const normalizedTeams: ITeamStats[] = (teams || []).map((t: any) => ({
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
        <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/85 to-black/90" />
        <div className="modal-container relative z-10 w-full max-w-[98%] sm:max-w-none mx-auto p-4 sm:p-6">
          <div className="text-center mb-6">
            <h1 className="text-2xl sm:text-4xl font-bold font-montserrat tracking-wide bg-gradient-to-r from-orange-500 via-yellow-400 to-orange-500 bg-clip-text text-transparent drop-shadow-2xl">
              {tournamentTitle}
            </h1>
          </div>
          <div className="flex text-white justify-center">
            <LoaderFive text="Loading standings..." />
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
        
        /* Glowing title effect */
        @keyframes titleGlow {
          0%, 100% { filter: drop-shadow(0 0 20px rgba(249, 115, 22, 0.4)); }
          50% { filter: drop-shadow(0 0 30px rgba(249, 115, 22, 0.6)); }
        }
        
        .title-glow {
          animation: titleGlow 3s ease-in-out infinite;
        }
      `}</style>

      {/* Premium gradient overlay - lighter to show more background */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/65 to-black/75" />

      {/* Decorative corner accents */}
      <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-orange-500/20 to-transparent pointer-events-none" />
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-orange-500/20 to-transparent pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-orange-500/10 to-transparent pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-orange-500/10 to-transparent pointer-events-none" />

      <div className="modal-container relative z-10 w-full max-w-7xl 2xl:max-w-[90rem] mx-auto p-4 sm:p-6">
        {/* Premium Header Section */}
        <div className="text-center mb-6 sm:mb-8">
          {/* Main Title - Using solid color with glow for screenshot compatibility */}
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold font-montserrat tracking-wide text-orange-500 pb-1"
            style={{
              textShadow: '0 0 30px rgba(249, 115, 22, 0.6), 0 0 60px rgba(249, 115, 22, 0.3), 0 2px 4px rgba(0,0,0,0.5)'
            }}>
            {tournamentTitle}
          </h1>

          {/* Season & Match Info - on separate row */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            {/* Season Badge */}
            {selectedSeasonName && (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30">
                <Gamepad2 className="h-3.5 w-3.5 text-blue-400" />
                <span className="text-xs font-semibold text-blue-400">
                  {selectedSeasonName}
                </span>
              </div>
            )}

            {/* Match Info Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
              <Trophy className="h-3.5 w-3.5 text-orange-400" />
              <span className="text-xs font-medium text-zinc-300">
                {isOverall ? "Overall Rankings" : `Match ${displayMatchNumber ?? ""} Results`}
              </span>
            </div>
          </div>
        </div>

        {/* Content Panel with glassmorphism */}
        <div className="rounded-2xl border border-white/10 bg-black/50 backdrop-blur-md shadow-2xl shadow-black/50 p-4 sm:p-6">
          <TwoColumnTable teams={normalizedTeams} />
        </div>

        {/* Premium Footer */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-zinc-500 text-xs">
          <div className="flex items-center gap-2">
            <div className="h-px w-8 bg-gradient-to-r from-transparent to-orange-500/50" />
            <span className="font-medium text-zinc-400">Designed by Pixel-Thread</span>
            <div className="h-px w-8 bg-gradient-to-l from-transparent to-orange-500/50" />
          </div>
          <div className="flex items-center gap-1.5 text-zinc-500">
            <Calendar className="h-3 w-3" />
            <span>{todayFormatted}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
