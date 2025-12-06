import { prisma } from "@/src/lib/db/prisma";
import { Prisma } from "@/src/lib/db/prisma/generated/prisma";
import { getTournamentById } from "@/src/services/tournament/getTournamentById";
import { addTournamentWinner } from "@/src/services/winner/addTournamentWinner";
import { getUniqedTournamentWinners } from "@/src/services/winner/getTournamentWinner";
import { calculatePlayerPoints } from "@/src/utils/calculatePlayersPoints";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { superAdminMiddleware } from "@/src/utils/middleware/superAdminMiddleware";
import { tokenMiddleware } from "@/src/utils/middleware/tokenMiddleware";
import { ErrorResponse, SuccessResponse } from "@/src/utils/next-response";
import { NextRequest } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await superAdminMiddleware(req);
    const tournamentId = (await params).id;

    const isTournamentExist = await getTournamentById({ id: tournamentId });

    if (!isTournamentExist) {
      return ErrorResponse({ message: "Tournament not found" });
    }

    if (!isTournamentExist.isWinnerDeclared) {
      return ErrorResponse({ message: "Tournament Winner not declared" });
    }

    const tournamentWinners = await getUniqedTournamentWinners({
      where: { tournamentId },
    });

    const data = tournamentWinners.map((winner) => {
      return {
        id: winner.id,
        amount: winner.amount,
        position: winner.position,
        teamName: winner.team.players
          .map((player) => player.user.userName)
          .join(", "),
        teamId: winner.team.id,
      };
    });
    return SuccessResponse({
      message: "Tournament Winners",
      data: data,
    });
  } catch (error) {
    return handleApiErrors(error);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const id = (await params).id;
    await tokenMiddleware(req);

    const body = await req.json();
    const { placements } = body as {
      placements?: { position: number; amount: number }[];
    };

    let where: Prisma.TeamStatsWhereInput;
    where = { tournamentId: id };

    const tournament = await getTournamentById({ id: id });

    if (!tournament) {
      return ErrorResponse({ message: "Tournament not found" });
    }

    if (tournament.isWinnerDeclared) {
      return ErrorResponse({ message: "Tournament Winner already declared" });
    }

    const teamsStats = await prisma.teamStats.findMany({
      where,
      include: {
        teamPlayerStats: true,
        team: {
          include: { matches: true, players: { include: { user: true } } },
        },
      },
    });

    const groupTeamsStats = await prisma.teamPlayerStats.groupBy({
      where: {
        teamStats: { tournamentId: id },
      },
      by: ["teamId"],
      _sum: {
        kills: true,
      },
    });

    const mappedData = groupTeamsStats.map((team) => {
      const position =
        teamsStats.find((teamStats) => teamStats.teamId === team.teamId)
          ?.position || 0;

      const groupStats = teamsStats.map((stat) => {
        const kills =
          stat.teamPlayerStats.reduce((acc, val) => acc + val.kills, 0) || 0;
        const pts = calculatePlayerPoints(stat.position, 0);
        const total = kills + pts;
        return {
          ...stat,
          pts,
          total,
        };
      });

      const pts = groupStats
        .filter((val) => val.teamId === team.teamId)
        .reduce((acc, stat) => acc + stat.pts, 0);
      const kills = team?._sum?.kills || 0;
      const total = kills + pts;
      const teamStats = teamsStats.find(
        (teamStats) => teamStats.teamId === team.teamId,
      );
      return {
        name: teamStats?.team?.name || "",
        teamId: team.teamId,
        kills: team._sum.kills,
        position: position,
        total: total,
        matches: teamStats?.team?.matches.length,
        pts: pts,
        players: teamStats?.team?.players.map((player) => ({
          id: player.id,
          name: player.user.userName,
        })),
      };
    });

    // Sort teams by total points (highest first)
    const sortedData = mappedData.sort((a, b) => b.total - a.total);

    // Use custom placements if provided, otherwise default to top 2 with default amounts
    const placementsToUse = placements && placements.length > 0
      ? placements
      : [
        { position: 1, amount: 340 },
        { position: 2, amount: 140 },
      ];

    // Validate we have enough teams for the placements
    if (sortedData.length < placementsToUse.length) {
      return ErrorResponse({
        message: `Not enough teams. Need ${placementsToUse.length} teams but only ${sortedData.length} available.`
      });
    }

    let winnerTeam = [];
    for (let i = 0; i < placementsToUse.length; i++) {
      const placement = placementsToUse[i];
      const team = sortedData[placement.position - 1]; // position is 1-indexed

      if (!team) continue;

      const winTeam = await addTournamentWinner({
        data: {
          amount: placement.amount,
          position: placement.position,
          team: { connect: { id: team.teamId } },
          tournament: { connect: { id: id } },
        },
      });

      winnerTeam.push(winTeam);
    }

    return SuccessResponse({
      message: "Tournament winners declared successfully",
      data: winnerTeam,
    });
  } catch (error) {
    return handleApiErrors(error);
  }
}

