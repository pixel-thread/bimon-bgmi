// DesktopTable.tsx
"use client";

import { CombinedTeamData } from "@/src/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";

interface DesktopTableProps {
  teams: CombinedTeamData[];
  getScore: (team: CombinedTeamData) => {
    kills: number;
    placementPoints: number;
    chickens: number;
    matchesPlayed: number;
  };
}

export default function DesktopTable({ teams, getScore }: DesktopTableProps) {
  return (
    <div className="desktop-table hidden sm:block overflow-x-auto max-h-[600px] overflow-y-auto border border-gray-600 rounded-lg bg-gray-900/80">
      <Table className="table-fixed">
        <TableHeader className="sticky top-0 z-10">
          <TableRow className="bg-gray-800/90 shadow-sm">
            <TableHead className="w-[10%] p-2 text-center text-white font-semibold rounded-tl-xl text-xs">
              #
            </TableHead>
            <TableHead className="w-[35%] p-2 text-left text-white font-semibold text-xs">
              Team
            </TableHead>
            <TableHead className="w-[15%] p-2 text-center text-white font-semibold text-xs">
              Matches
            </TableHead>
            <TableHead className="w-[15%] p-2 text-center text-white font-semibold text-xs">
              Pts
            </TableHead>
            <TableHead className="w-[15%] p-2 text-center text-white font-semibold text-xs">
              Kills
            </TableHead>
            <TableHead className="w-[10%] p-2 text-center text-white font-semibold rounded-tr-xl text-xs">
              Total
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="text-white">
          {teams.map((team, index) => {
            const score = getScore(team);
            const totalPts = score.kills + score.placementPoints;
            return (
              <TableRow
                key={team.id}
                className="border-b border-gray-700/50 hover:bg-gray-800/40 transition-colors"
              >
                <TableCell className="p-2 text-center font-bold text-orange-500 text-xs">
                  {index + 1}
                </TableCell>
                <TableCell className="p-2 font-medium text-xs truncate">
                  {team.teamName} {score.chickens > 0 && `🍗 ${score.chickens}`}
                </TableCell>
                <TableCell className="p-2 text-center text-gray-300 text-xs">
                  {score.matchesPlayed}
                </TableCell>
                <TableCell className="p-2 text-center text-blue-400 text-xs">
                  {score.placementPoints}
                </TableCell>
                <TableCell className="p-2 text-center text-green-400 text-xs">
                  {score.kills}
                </TableCell>
                <TableCell className="p-2 text-center font-bold text-base text-orange-500">
                  {totalPts}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
