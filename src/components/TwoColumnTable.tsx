// TwoColumnTable.tsx
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
import { Team } from "../lib/db/prisma/generated/prisma";
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
  players: IPlayer[];
}

interface TwoColumnTableProps {
  teams: ITeamStats[];
}

export default function TwoColumnTable({ teams }: TwoColumnTableProps) {
  const useDoubleColumn = teams.length > 10;
  const midPoint = Math.ceil(teams.length / 2);
  const firstHalfTeams = useDoubleColumn ? teams.slice(0, midPoint) : teams;
  const secondHalfTeams = useDoubleColumn ? teams.slice(midPoint) : [];

  const renderTableContent = (
    teamsToRender: ITeamStats[],
    startIndex: number = 0,
  ) => (
    <Table className="table-fixed">
      <TableHeader className="sticky top-0 z-10 bg-gradient-to-r from-orange-600 via-orange-500 to-orange-600">
        <TableRow className="border-b-2 border-orange-400 hover:bg-transparent">
          <TableHead className="w-[8%] p-3 text-center text-white font-bold text-sm tracking-wider">
            #
          </TableHead>
          <TableHead className="w-[40%] p-3 text-left text-white font-bold text-sm tracking-wider">
            TEAM
          </TableHead>
          <TableHead className="w-[13%] p-3 text-center text-white font-bold text-sm tracking-wider">
            M
          </TableHead>
          <TableHead className="w-[13%] p-3 text-center text-white font-bold text-sm tracking-wider">
            PTS
          </TableHead>
          <TableHead className="w-[13%] p-3 text-center text-white font-bold text-sm tracking-wider">
            KILLS
          </TableHead>
          <TableHead className="w-[13%] p-3 text-center text-white font-bold text-sm tracking-wider">
            TOTAL
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody className="text-white">
        {teamsToRender.map((team, index) => {
          const actualRank = startIndex + index + 1;

          return (
            <TableRow
              key={team.id}
              className={cn(
                "border-b border-gray-700/30 transition-all duration-200 hover:bg-orange-500/10",
                actualRank === 1 &&
                  "bg-gradient-to-r from-yellow-500/20 via-transparent to-transparent border-l-4 border-yellow-500",
                actualRank === 2 &&
                  "bg-gradient-to-r from-gray-400/20 via-transparent to-transparent border-l-4 border-gray-400",
                actualRank === 3 &&
                  "bg-gradient-to-r from-orange-600/20 via-transparent to-transparent border-l-4 border-orange-600",
                actualRank > 3 && "border-l-4 border-transparent",
              )}
            >
              <TableCell className="p-3 text-center">
                <span
                  className={cn(
                    "font-black text-sm inline-block min-w-[24px]",
                    actualRank === 1 && "text-yellow-400 text-lg",
                    actualRank === 2 && "text-gray-300 text-lg",
                    actualRank === 3 && "text-orange-400 text-lg",
                    actualRank > 3 && "text-orange-500",
                  )}
                >
                  {actualRank}
                </span>
              </TableCell>
              <TableCell className="p-3 font-semibold text-sm text-left">
                <div className="flex items-center gap-2">
                  <span className="truncate">
                    {team.players.map((player) => player.name).join("_")}
                  </span>
                  {team.position === 1 && (
                    <span className="text-base flex-shrink-0">
                      🍗{" "}
                      <span className="text-yellow-400 font-bold">
                        {team.position}
                      </span>
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell className="p-3 text-center text-gray-300 font-medium text-sm">
                {team.matches}
              </TableCell>
              <TableCell className="p-3 text-center text-blue-400 font-semibold text-sm">
                {team.pts}
              </TableCell>
              <TableCell className="p-3 text-center font-semibold text-sm">
                <span
                  className={cn(
                    team.kills >= 20
                      ? "text-red-400"
                      : team.kills >= 10
                        ? "text-orange-400"
                        : "text-green-400",
                  )}
                >
                  {team.kills}
                </span>
              </TableCell>
              <TableCell className="p-3 text-center">
                <span className="font-black text-lg text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]">
                  {team.total}
                </span>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );

  if (useDoubleColumn) {
    return (
      <div className="desktop-view w-full">
        <div className="border-2 border-orange-500/40 rounded-xl overflow-hidden bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 shadow-2xl shadow-orange-500/20">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-orange-600 via-orange-500 to-orange-600 p-4 border-b-4 border-orange-400 shadow-lg">
            <h2 className="text-2xl font-black text-white tracking-wider uppercase text-center flex items-center justify-center gap-3">
              <span className="text-3xl">🏆</span>
              <span>LEADERBOARD</span>
              <span className="text-3xl">🏆</span>
            </h2>
          </div>

          <div className="p-6">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* First Column */}
              <div className="flex-1 max-h-[650px] overflow-y-auto rounded-lg border border-orange-500/30 bg-black/40">
                {renderTableContent(firstHalfTeams, 0)}
              </div>

              {/* Second Column */}
              {secondHalfTeams.length > 0 && (
                <div className="flex-1 max-h-[650px] overflow-y-auto rounded-lg border border-orange-500/30 bg-black/40">
                  {renderTableContent(secondHalfTeams, midPoint)}
                </div>
              )}
            </div>
          </div>

          {/* Footer Stats */}
          <div className="bg-black/60 backdrop-blur-sm p-3 border-t-2 border-orange-500/30 flex justify-between items-center">
            <div className="text-sm text-gray-400">
              Total Teams:{" "}
              <span className="text-orange-500 font-bold">{teams.length}</span>
            </div>
            <div className="text-sm text-gray-400 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span>Live Updates</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Single column layout
  return (
    <div className="desktop-view w-full">
      <div className="border-2 border-orange-500/40 rounded-xl overflow-hidden bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 shadow-2xl shadow-orange-500/20">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-orange-600 via-orange-500 to-orange-600 p-4 border-b-4 border-orange-400 shadow-lg">
          <h2 className="text-2xl font-black text-white tracking-wider uppercase text-center flex items-center justify-center gap-3">
            <span className="text-3xl">🏆</span>
            <span>LEADERBOARD</span>
            <span className="text-3xl">🏆</span>
          </h2>
        </div>

        <div className="max-h-[600px] overflow-y-auto">
          {renderTableContent(teams, 0)}
        </div>

        {/* Footer Stats */}
        <div className="bg-black/60 backdrop-blur-sm p-3 border-t-2 border-orange-500/30 flex justify-between items-center">
          <div className="text-sm text-gray-400">
            Total Teams:{" "}
            <span className="text-orange-500 font-bold">{teams.length}</span>
          </div>
          <div className="text-sm text-gray-400 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span>Live Updates</span>
          </div>
        </div>
      </div>
    </div>
  );
}
