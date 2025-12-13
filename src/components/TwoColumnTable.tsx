// TwoColumnTable.tsx - Premium BGMI Esports Standings Design
"use client";

import { cn } from "@/src/lib/utils";

export interface IPlayer {
  id: string;
  name: string;
}

export interface ITeamStats {
  id: string;
  name: string;
  teamId: string;
  kills: number;
  position: number;
  total: number;
  matches: number;
  pts: number;
  wins: number;
  players: IPlayer[];
}

interface TwoColumnTableProps {
  teams: ITeamStats[];
}

// Rank badge styling with premium gradients
const getRankStyles = (rank: number) => {
  switch (rank) {
    case 1:
      return {
        badge: "bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-500 text-black shadow-[0_0_12px_rgba(234,179,8,0.6)] border border-yellow-300/50 font-black",
        row: "bg-gradient-to-r from-yellow-500/15 via-yellow-400/10 to-transparent border-l-2 border-l-yellow-400",
      };
    case 2:
      return {
        badge: "bg-gradient-to-r from-gray-400 via-gray-200 to-gray-300 text-black shadow-[0_0_10px_rgba(156,163,175,0.5)] border border-gray-200/50 font-black",
        row: "bg-gradient-to-r from-gray-400/15 via-gray-300/10 to-transparent border-l-2 border-l-gray-300",
      };
    case 3:
      return {
        badge: "bg-gradient-to-r from-orange-700 via-orange-500 to-orange-600 text-white shadow-[0_0_10px_rgba(234,88,12,0.5)] border border-orange-400/50 font-black",
        row: "bg-gradient-to-r from-orange-500/15 via-orange-400/10 to-transparent border-l-2 border-l-orange-500",
      };
    default:
      return {
        badge: "bg-zinc-800/80 text-zinc-300 border border-zinc-700/50",
        row: "hover:bg-white/5",
      };
  }
};

export default function TwoColumnTable({ teams }: TwoColumnTableProps) {
  // Mobile cards (smaller screens)
  const MobileList = (
    <div className="mobile-list sm:hidden space-y-2 max-h-[60vh] overflow-y-auto custom-scrollbar pr-1">
      {teams.map((team, index) => {
        const rank = index + 1;
        const teamName = team.players.map((p) => p.name).join("_");
        const styles = getRankStyles(rank);

        return (
          <div
            key={team.teamId || team.id}
            className={cn(
              "rounded-lg border border-white/10 bg-black/40 backdrop-blur-sm px-3 py-2.5 flex items-start gap-3 transition-all duration-200",
              styles.row
            )}
          >
            <div
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-all",
                styles.badge
              )}
              aria-label={`Rank ${rank}`}
            >
              {rank}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className={cn(
                  "text-sm font-semibold truncate",
                  rank <= 3 ? "text-white" : "text-zinc-200"
                )}>
                  {teamName}
                </span>
                {team.wins > 0 && (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400 text-[10px] font-bold">
                    🍗{team.wins > 1 ? ` ×${team.wins}` : ""}
                  </span>
                )}
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10px]">
                <span className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-zinc-400">
                  <span className="text-zinc-500">M</span>
                  <span className="font-medium text-zinc-300">{team.matches}</span>
                </span>
                <span className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-zinc-400">
                  <span className="text-zinc-500">PTS</span>
                  <span className="font-medium text-zinc-300">{team.pts}</span>
                </span>
                <span className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-zinc-400">
                  <span className="text-zinc-500">K</span>
                  <span className="font-medium text-zinc-300">{team.kills}</span>
                </span>
                <span className="inline-flex items-center gap-1 rounded-md border border-orange-500/30 bg-orange-500/10 px-2 py-0.5">
                  <span className="text-orange-400/70">TOTAL</span>
                  <span className="font-bold text-orange-400">{team.total}</span>
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  // Custom table renderer (desktop) - using plain HTML for better screenshot compatibility
  const renderDesktopTable = (slice: ITeamStats[], startIndex = 0) => (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-black/30 backdrop-blur-sm">
      <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
        <colgroup>
          <col style={{ width: '50px' }} />
          <col />
          <col style={{ width: '50px' }} />
          <col style={{ width: '60px' }} />
          <col style={{ width: '60px' }} />
          <col style={{ width: '70px' }} />
        </colgroup>
        <thead>
          <tr className="border-b border-white/10 bg-gradient-to-r from-orange-500/10 via-transparent to-orange-500/10">
            <th className="px-2 py-2.5 text-center text-[10px] font-bold uppercase tracking-wider text-orange-400">#</th>
            <th className="px-2 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-orange-400">Team</th>
            <th className="px-2 py-2.5 text-center text-[10px] font-bold uppercase tracking-wider text-zinc-500">M</th>
            <th className="px-2 py-2.5 text-center text-[10px] font-bold uppercase tracking-wider text-zinc-500">PTS</th>
            <th className="px-2 py-2.5 text-center text-[10px] font-bold uppercase tracking-wider text-zinc-500">Kills</th>
            <th className="px-2 py-2.5 text-center text-[10px] font-bold uppercase tracking-wider text-orange-400">Total</th>
          </tr>
        </thead>
        <tbody>
          {slice.map((team, idx) => {
            const rank = startIndex + idx + 1;
            const teamName = team.players.map((p) => p.name).join("_");
            const styles = getRankStyles(rank);

            return (
              <tr
                key={team.teamId || team.id}
                className={cn(
                  "border-b border-white/5 transition-all duration-200",
                  styles.row
                )}
              >
                <td className="px-2 py-2 text-center align-middle">
                  <span
                    className={cn(
                      "inline-flex h-6 w-6 items-center justify-center rounded-md text-[11px] font-bold",
                      styles.badge
                    )}
                  >
                    {rank}
                  </span>
                </td>
                <td className="px-2 py-2 text-left align-middle">
                  <div className="flex items-center gap-1.5 overflow-hidden">
                    <span className={cn(
                      "truncate font-semibold text-sm",
                      rank <= 3 ? "text-white" : "text-zinc-300"
                    )}>
                      {teamName}
                    </span>
                    {team.wins > 0 && (
                      <span className="inline-flex items-center shrink-0 gap-0.5 px-1 py-0.5 rounded bg-yellow-500/20 text-yellow-400 text-[9px] font-bold">
                        🍗{team.wins > 1 ? `×${team.wins}` : ""}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-2 py-2 text-center align-middle text-zinc-500 tabular-nums font-mono text-xs">{team.matches}</td>
                <td className="px-2 py-2 text-center align-middle text-zinc-300 font-medium tabular-nums font-mono text-xs">{team.pts}</td>
                <td className="px-2 py-2 text-center align-middle text-zinc-400 tabular-nums font-mono text-xs">{team.kills}</td>
                <td className="px-2 py-2 text-center align-middle">
                  <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded bg-orange-500/15 text-orange-400 font-bold tabular-nums font-mono text-xs border border-orange-500/20">
                    {team.total}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  // Desktop Table (>= sm)
  // Always use two columns on lg+ screens for better space utilization
  const DesktopTable = (
    <div className="desktop-table hidden sm:block">
      {/* Two columns on lg+ screens */}
      <div className="hidden lg:flex lg:gap-4 lg:justify-center">
        <div className="flex-1 max-w-[520px]">
          {renderDesktopTable(teams.slice(0, Math.ceil(teams.length / 2)), 0)}
        </div>
        <div className="flex-1 max-w-[520px]">
          {renderDesktopTable(teams.slice(Math.ceil(teams.length / 2)), Math.ceil(teams.length / 2))}
        </div>
      </div>
      {/* Single column for sm-md screens */}
      <div className="block lg:hidden">
        {renderDesktopTable(teams, 0)}
      </div>
    </div>
  );

  return (
    <div className="w-full">
      {MobileList}
      {DesktopTable}
    </div>
  );
}
