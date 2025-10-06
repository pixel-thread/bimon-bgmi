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

interface MobileTableProps {
  teams: CombinedTeamData[];
  getScore: (team: CombinedTeamData) => {
    kills: number;
    placementPoints: number;
    chickens: number;
    matchesPlayed: number;
  };
}

export default function MobileTable({ teams, getScore }: MobileTableProps) {
  // Better balanced height - show more teams but not overwhelming
  const maxHeight =
    teams.length > 30
      ? "max-h-[550px]"
      : teams.length > 20
      ? "max-h-[500px]"
      : "max-h-[450px]";

  return (
    <div className="flex justify-center w-full px-4">
      <div
        className={`mobile-table ${maxHeight} relative border border-gray-600 rounded-lg w-full max-w-sm mx-auto bg-gray-900/80`}
      >
        <div className="overflow-y-auto h-full">
          <Table className="table-fixed w-full">
            <TableHeader className="sticky top-0 z-20 bg-gray-800 shadow-lg border-b border-gray-600">
              <TableRow>
                <TableHead className="w-[12%] px-1 py-2 text-center text-white font-semibold text-[10px]">
                  #
                </TableHead>
                <TableHead className="w-[38%] px-1 py-2 text-left text-white font-semibold text-[10px]">
                  Team
                </TableHead>
                <TableHead className="w-[12%] px-1 py-2 text-center text-white font-semibold text-[10px]">
                  Matches
                </TableHead>
                <TableHead className="w-[12%] px-1 py-2 text-center text-white font-semibold text-[10px]">
                  Pts
                </TableHead>
                <TableHead className="w-[13%] px-1 py-2 text-center text-white font-semibold text-[10px]">
                  Kills
                </TableHead>
                <TableHead className="w-[13%] px-1 py-2 text-center text-white font-semibold text-[10px]">
                  Total
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="text-white">
              {teams.map((team, index) => {
                const score = getScore(team);
                const totalPts = score.kills + score.placementPoints;
                const teamDisplayName = `${team.teamName}${
                  score.chickens > 0 ? ` 🍗 ${score.chickens}` : ""
                }`;

                // Better threshold calculation for 10px font in 38% width container
                // At 320px screen width: 38% ≈ 120px, 10px font ≈ 6px per char
                // So roughly 20 characters fit comfortably
                const needsScrolling = teamDisplayName.length > 18;

                return (
                  <TableRow
                    key={team.id}
                    className="border-b border-gray-700/50 hover:bg-gray-800/40 transition-colors"
                  >
                    <TableCell className="w-[12%] px-1 py-2 text-center font-bold text-orange-500 text-[10px]">
                      {index + 1}
                    </TableCell>
                    <TableCell className="w-[38%] px-1 py-2 font-medium text-[10px] overflow-hidden relative">
                      {needsScrolling ? (
                        <div className="whitespace-nowrap overflow-hidden">
                          <div className="animate-marquee inline-block">
                            {teamDisplayName}
                          </div>
                        </div>
                      ) : (
                        <div className="whitespace-nowrap">
                          {teamDisplayName}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="w-[12%] px-1 py-2 text-center text-gray-300 text-[10px]">
                      {score.matchesPlayed}
                    </TableCell>
                    <TableCell className="w-[12%] px-1 py-2 text-center text-blue-400 text-[10px]">
                      {score.placementPoints}
                    </TableCell>
                    <TableCell className="w-[13%] px-1 py-2 text-center text-green-400 text-[10px]">
                      {score.kills}
                    </TableCell>
                    <TableCell className="w-[13%] px-1 py-2 text-center font-bold text-sm text-orange-500">
                      {totalPts}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Smooth marquee animation with better easing */}
        <style jsx>{`
          @keyframes smooth-marquee {
            0% {
              transform: translateX(0%);
            }
            20% {
              transform: translateX(0%);
            }
            80% {
              transform: translateX(calc(-100% + 85px));
            }
            100% {
              transform: translateX(calc(-100% + 85px));
            }
          }

          .animate-marquee {
            animation: smooth-marquee 5s cubic-bezier(0.25, 0.46, 0.45, 0.94)
              infinite;
            display: inline-block;
            white-space: nowrap;
            will-change: transform;
            backface-visibility: hidden;
            -webkit-font-smoothing: antialiased;
          }

          .animate-marquee:hover {
            animation-play-state: paused;
          }

          /* Smooth transitions for better performance */
          .animate-marquee {
            transform: translateZ(0);
          }
        `}</style>
      </div>
    </div>
  );
}
