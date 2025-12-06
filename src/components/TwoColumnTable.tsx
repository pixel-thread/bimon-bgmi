// TwoColumnTable.tsx (minimal, responsive redesign)
"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
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

export default function TwoColumnTable({ teams }: TwoColumnTableProps) {
  // Mobile cards (smaller screens)
  const MobileList = (
    <div className="mobile-list sm:hidden space-y-2 max-h-[60vh] overflow-y-auto">
      {teams.map((team, index) => {
        const rank = index + 1;
        const teamName = team.players.map((p) => p.name).join("_");
        return (
          <div
            key={team.teamId || team.id}
            className="rounded-md border border-border bg-background/60 px-3 py-2 flex items-start gap-3"
          >
            <div
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs font-semibold",
                rank === 1 && "bg-yellow-500/20 text-yellow-400",
                rank === 2 && "bg-gray-400/20 text-gray-300",
                rank === 3 && "bg-orange-500/20 text-orange-400",
                rank > 3 && "bg-muted text-foreground/70",
              )}
              aria-label={`Rank ${rank}`}
            >
              {rank}
            </div>
            <div className="min-w-0 flex-1 marquee-on-hover">
              <div className="text-sm font-medium truncate marquee-text">
                {teamName}
                {team.wins > 0 && (
                  <span className="ml-2 text-yellow-500 font-bold">
                    🍗{team.wins > 1 ? ` x${team.wins}` : ""}
                  </span>
                )}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1 rounded border px-2 py-0.5">
                  <span className="opacity-70">M</span>
                  <span className="font-medium">{team.matches}</span>
                </span>
                <span className="inline-flex items-center gap-1 rounded border px-2 py-0.5">
                  <span className="opacity-70">PTS</span>
                  <span className="font-medium">{team.pts}</span>
                </span>

                <span className="inline-flex items-center gap-1 rounded border px-2 py-0.5">
                  <span className="opacity-70">K</span>
                  <span className="font-medium">{team.kills}</span>
                </span>
                <span className="inline-flex items-center gap-1 rounded border px-2 py-0.5">
                  <span className="opacity-70">TOTAL</span>
                  <span className="font-semibold">{team.total}</span>
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  // Reusable minimal table renderer (desktop)
  const renderDesktopTable = (slice: ITeamStats[], startIndex = 0) => (
    <div className="overflow-x-auto rounded-md border border-border">
      <Table className="w-full table-fixed">
        <colgroup>
          <col style={{ width: "64px" }} />
          <col />
          <col style={{ width: "80px" }} />
          <col style={{ width: "100px" }} />
          <col style={{ width: "100px" }} />
          <col style={{ width: "108px" }} />
        </colgroup>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[64px] px-4 text-center tabular-nums font-mono whitespace-nowrap">#</TableHead>
            <TableHead className="px-4 pl-12 text-left">Team</TableHead>
            <TableHead className="w-[80px] px-4 text-center tabular-nums font-mono whitespace-nowrap">M</TableHead>
            <TableHead className="w-[100px] px-4 text-center tabular-nums font-mono whitespace-nowrap">PTS</TableHead>
            <TableHead className="w-[100px] px-4 text-center tabular-nums font-mono whitespace-nowrap">Kills</TableHead>
            <TableHead className="w-[108px] px-4 text-center tabular-nums font-mono whitespace-nowrap">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {slice.map((team, idx) => {
            const rank = startIndex + idx + 1;
            const teamName = team.players.map((p) => p.name).join("_");
            return (
              <TableRow key={team.teamId || team.id} className="hover:bg-muted/40">
                <TableCell className="px-4 py-2 text-center">
                  <span
                    className={cn(
                      "inline-flex h-7 w-7 items-center justify-center rounded-md text-xs font-semibold",
                      rank === 1 && "bg-yellow-500/20 text-yellow-400",
                      rank === 2 && "bg-gray-400/20 text-gray-300",
                      rank === 3 && "bg-orange-500/20 text-orange-400",
                      rank > 3 && "bg-muted text-foreground/70",
                    )}
                  >
                    {rank}
                  </span>
                </TableCell>
                <TableCell className="px-4 py-2 font-medium text-left align-top max-w-0">
                  <div className="truncate">
                    {teamName}
                    {team.wins > 0 && (
                      <span className="ml-2 text-yellow-500 font-bold">
                        🍗{team.wins > 1 ? ` x${team.wins}` : ""}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="px-4 py-2 text-center text-muted-foreground tabular-nums font-mono whitespace-nowrap">{team.matches}</TableCell>
                <TableCell className="px-4 py-2 text-center font-medium tabular-nums font-mono whitespace-nowrap">{team.pts}</TableCell>
                <TableCell className="px-4 py-2 text-center tabular-nums font-mono whitespace-nowrap">{team.kills}</TableCell>
                <TableCell className="px-4 py-2 text-center font-semibold tabular-nums font-mono whitespace-nowrap">{team.total}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );

  // Desktop Table (>= sm)
  // Always use two columns on lg+ screens for better space utilization
  const DesktopTable = (
    <div className="desktop-table hidden sm:block">
      {/* Single column on sm-md, two columns on lg+ */}
      <div className="hidden lg:grid lg:grid-cols-2 lg:gap-4">
        {renderDesktopTable(teams.slice(0, Math.ceil(teams.length / 2)), 0)}
        {renderDesktopTable(teams.slice(Math.ceil(teams.length / 2)), Math.ceil(teams.length / 2))}
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
