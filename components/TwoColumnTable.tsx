// TwoColumnTable.tsx
"use client";

import { CombinedTeamData } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface TwoColumnTableProps {
  teams: CombinedTeamData[];
  getScore: (team: CombinedTeamData) => { kills: number; placementPoints: number; chickens: number; matchesPlayed: number };
}

export default function TwoColumnTable({ teams, getScore }: TwoColumnTableProps) {
  // Use two columns for better visibility in shared images when there are many teams
  const useDoubleColumn = teams.length > 10;
  const midPoint = Math.ceil(teams.length / 2);
  const firstHalfTeams = useDoubleColumn ? teams.slice(0, midPoint) : teams;
  const secondHalfTeams = useDoubleColumn ? teams.slice(midPoint) : [];

  if (useDoubleColumn) {
    return (
      <div className="desktop-view w-full">
        <div className="border border-gray-600 rounded-lg p-4 bg-gray-900/80 max-h-[650px] overflow-y-auto">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* First Column */}
            <div className="flex-1 max-h-[600px] overflow-y-auto">
              <Table className="table-fixed">
                <TableHeader className="sticky top-0 z-10">
                  <TableRow className="bg-gray-800/90 shadow-sm">
                    <TableHead className="w-[8%] p-2 text-center text-white font-semibold text-xs">
                      #
                    </TableHead>
                    <TableHead className="w-[40%] p-2 text-left text-white font-semibold text-xs">
                      Team
                    </TableHead>
                    <TableHead className="w-[13%] p-2 text-center text-white font-semibold text-xs">
                      Matches
                    </TableHead>
                    <TableHead className="w-[13%] p-2 text-center text-white font-semibold text-xs">
                      Pts
                    </TableHead>
                    <TableHead className="w-[13%] p-2 text-center text-white font-semibold text-xs">
                      Kills
                    </TableHead>
                    <TableHead className="w-[13%] p-2 text-center text-white font-semibold text-xs">
                      Total
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="text-white">
                  {firstHalfTeams.map((team, index) => {
                    const score = getScore(team);
                    const totalPts = score.kills + score.placementPoints;
                    return (
                      <TableRow key={team.id} className="border-b border-gray-700/50 hover:bg-gray-800/40 transition-colors">
                        <TableCell className="p-2 text-center font-bold text-orange-500 text-xs">
                          {index + 1}
                        </TableCell>
                        <TableCell className="p-2 font-medium text-xs text-left">
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
            
            {/* Second Column */}
            {secondHalfTeams.length > 0 && (
              <div className="flex-1 max-h-[600px] overflow-y-auto">
                <Table className="table-fixed">
                  <TableHeader className="sticky top-0 z-10">
                    <TableRow className="bg-gray-800/90 shadow-sm">
                      <TableHead className="w-[8%] p-2 text-center text-white font-semibold text-xs">
                        #
                      </TableHead>
                      <TableHead className="w-[40%] p-2 text-left text-white font-semibold text-xs">
                        Team
                      </TableHead>
                      <TableHead className="w-[13%] p-2 text-center text-white font-semibold text-xs">
                        Matches
                      </TableHead>
                      <TableHead className="w-[13%] p-2 text-center text-white font-semibold text-xs">
                        Pts
                      </TableHead>
                      <TableHead className="w-[13%] p-2 text-center text-white font-semibold text-xs">
                        Kills
                      </TableHead>
                      <TableHead className="w-[13%] p-2 text-center text-white font-semibold text-xs">
                        Total
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="text-white">
                    {secondHalfTeams.map((team, index) => {
                      const score = getScore(team);
                      const totalPts = score.kills + score.placementPoints;
                      return (
                        <TableRow key={team.id} className="border-b border-gray-700/50 hover:bg-gray-800/40 transition-colors">
                          <TableCell className="p-2 text-center font-bold text-orange-500 text-xs">
                            {index + 1 + midPoint}
                          </TableCell>
                          <TableCell className="p-2 font-medium text-xs text-left">
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
            )}
          </div>
        </div>
      </div>
    );
  }

  // Single column layout for smaller team counts
  return (
    <div className="desktop-view w-full">
      <div className="max-h-[600px] overflow-y-auto border border-gray-600 rounded-lg bg-gray-900/80">
        <Table className="table-fixed">
          <TableHeader className="sticky top-0 z-10">
            <TableRow className="bg-gray-800/90">
              <TableHead className="w-[8%] p-2 text-center text-white font-semibold rounded-tl-xl text-xs align-middle">
                #
              </TableHead>
              <TableHead className="w-[40%] p-2 text-left text-white font-semibold text-xs align-middle">
                Team
              </TableHead>
              <TableHead className="w-[13%] p-2 text-center text-white font-semibold text-xs align-middle">
                Matches
              </TableHead>
              <TableHead className="w-[13%] p-2 text-center text-white font-semibold text-xs align-middle">
                Pts
              </TableHead>
              <TableHead className="w-[13%] p-2 text-center text-white font-semibold text-xs align-middle">
                Kills
              </TableHead>
              <TableHead className="w-[13%] p-2 text-center text-white font-semibold rounded-tr-xl text-xs align-middle">
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
                  <TableCell className="p-2 text-center font-bold text-orange-500 text-xs align-middle">
                    {index + 1}
                  </TableCell>
                  <TableCell className="p-2 font-medium text-xs text-left align-middle">
                    {team.teamName} {score.chickens > 0 && `🍗 ${score.chickens}`}
                  </TableCell>
                  <TableCell className="p-2 text-center text-gray-300 text-xs align-middle">
                    {score.matchesPlayed}
                  </TableCell>
                  <TableCell className="p-2 text-center text-blue-400 text-xs align-middle">
                    {score.placementPoints}
                  </TableCell>
                  <TableCell className="p-2 text-center text-green-400 text-xs align-middle">
                    {score.kills}
                  </TableCell>
                  <TableCell className="p-2 text-center font-bold text-base text-orange-500 align-middle">
                    {totalPts}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}