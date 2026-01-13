import { prisma } from "@/src/lib/db/prisma";
import { Prisma } from "@/src/lib/db/prisma/generated/prisma";
import { getTournamentById } from "@/src/services/tournament/getTournamentById";
import { addTournamentWinner } from "@/src/services/winner/addTournamentWinner";
import { getUniqedTournamentWinners } from "@/src/services/winner/getTournamentWinner";
import { getPlayerRecentWins } from "@/src/services/winner/getPlayerRecentWins";
import { getPlayerLosses, isPlayerSolo, addToSoloTaxPool } from "@/src/services/winner/getPlayerLosses";
import { calculatePlayerPoints } from "@/src/utils/calculatePlayersPoints";
import { calculateRepeatWinnerTax, aggregateTaxTotals, TaxResult } from "@/src/utils/repeatWinnerTax";
import { calculateSoloTax, getTaxDistribution, calculateTierDistribution, getLoserSupportMessage, SoloTaxResult } from "@/src/utils/soloTax";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { superAdminMiddleware } from "@/src/utils/middleware/superAdminMiddleware";
import { tokenMiddleware } from "@/src/utils/middleware/tokenMiddleware";
import { ErrorResponse, SuccessResponse } from "@/src/utils/next-response";
import { NextRequest } from "next/server";
import { resetMeritAfterSolo } from "@/src/services/merit/calculateMerit";

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
          .map((player) => player.user.displayName || player.user.userName)
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
          displayName: player.user.displayName,
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

    // Collect all winning player IDs to fetch their recent wins
    const allWinningPlayerIds: string[] = [];
    for (let i = 0; i < placementsToUse.length; i++) {
      const team = sortedData[placementsToUse[i].position - 1];
      if (team?.players) {
        for (const player of team.players) {
          allWinningPlayerIds.push(player.id);
        }
      }
    }

    // Fetch recent wins for all winning players (for repeat winner tax)
    const playerWinCounts = await getPlayerRecentWins(
      allWinningPlayerIds,
      tournament.seasonId || "",
      6
    );

    // Track all tax results to calculate fund/org contributions
    const allTaxResults: TaxResult[] = [];

    // Track solo tax results for loser distribution
    const allSoloTaxResults: SoloTaxResult[] = [];

    let winnerTeam = [];
    for (let i = 0; i < placementsToUse.length; i++) {
      const placement = placementsToUse[i];
      const team = sortedData[placement.position - 1]; // position is 1-indexed

      if (!team) continue;

      // Create winner record 
      const winTeam = await addTournamentWinner({
        data: {
          amount: placement.amount,
          position: placement.position,
          team: { connect: { id: team.teamId } },
          tournament: { connect: { id: id } },
        },
      });

      // Distribute UC to players if amount > 0
      if (placement.amount > 0 && team.players && team.players.length > 0) {
        const basePerPlayerAmount = Math.floor(placement.amount / team.players.length);

        for (const player of team.players) {
          // Get player with user info
          const playerData = await prisma.player.findUnique({
            where: { id: player.id },
            include: { user: true },
          });

          if (!playerData) continue;

          // Check if player voted SOLO
          const isSolo = await isPlayerSolo(player.id, id);

          // Calculate repeat winner tax for this player
          // Add +1 to include the CURRENT win they're receiving now
          const previousWins = playerWinCounts.get(player.id) || 0;
          const totalWinsIncludingCurrent = previousWins + 1;
          const taxResult = calculateRepeatWinnerTax(player.id, basePerPlayerAmount, totalWinsIncludingCurrent);
          allTaxResults.push(taxResult);

          // Calculate solo tax on top of repeat winner tax
          const soloTaxResult = calculateSoloTax(player.id, taxResult.netAmount, isSolo);
          if (soloTaxResult.isSolo) {
            allSoloTaxResults.push(soloTaxResult);
          }

          // Use net amount after both taxes
          const finalAmount = soloTaxResult.netAmount;

          // Update or create UC balance
          await prisma.uC.upsert({
            where: { playerId: player.id },
            create: {
              player: { connect: { id: player.id } },
              user: { connect: { id: playerData.user.id } },
              balance: finalAmount,
            },
            update: { balance: { increment: finalAmount } },
          });

          // Create single transaction record (shows net amount player receives)
          const prizeDescription = `${getOrdinal(placement.position)} Place Prize: ${tournament.name}`;

          await prisma.transaction.create({
            data: {
              amount: finalAmount,
              type: "credit",
              description: prizeDescription,
              playerId: player.id,
            },
          });
        }

        // Mark winner as distributed
        await prisma.tournamentWinner.update({
          where: { id: winTeam.id },
          data: { isDistributed: true },
        });
      }

      winnerTeam.push(winTeam);
    }

    // Mark tournament as completed with winners declared and set to INACTIVE
    await prisma.tournament.update({
      where: { id: id },
      data: {
        isWinnerDeclared: true,
        status: "INACTIVE",
      },
    });

    // Reset merit for solo-restricted players who completed this tournament
    // Find all players who participated in this tournament and are solo-restricted
    const tournamentPlayers = await prisma.matchPlayerPlayed.findMany({
      where: { tournamentId: id },
      select: { playerId: true },
      distinct: ["playerId"],
    });

    for (const { playerId } of tournamentPlayers) {
      const player = await prisma.player.findUnique({
        where: { id: playerId },
        select: { isSoloRestricted: true, soloMatchesNeeded: true },
      });

      if (player?.isSoloRestricted) {
        // Decrement solo matches needed
        const newSoloMatchesNeeded = (player.soloMatchesNeeded || 1) - 1;

        if (newSoloMatchesNeeded <= 0) {
          // Player completed their solo requirement - reset merit to 100%
          await resetMeritAfterSolo(playerId);
        } else {
          // Player still needs more solo matches
          await prisma.player.update({
            where: { id: playerId },
            data: { soloMatchesNeeded: newSoloMatchesNeeded },
          });
        }
      }
    }

    // Calculate total repeat winner tax contributions
    const taxTotals = aggregateTaxTotals(allTaxResults);

    // Calculate and record Fund & Org as Income
    const entryFee = tournament.fee || 0;
    if (entryFee > 0) {
      // Count all players in tournament teams
      const tournamentTeams = await prisma.team.findMany({
        where: { tournamentId: id },
        include: {
          players: {
            select: { isUCExempt: true },
          },
        },
      });

      // Count total participants and UC-exempt count
      let totalParticipants = 0;
      let ucExemptCount = 0;
      tournamentTeams.forEach(team => {
        team.players.forEach(player => {
          totalParticipants++;
          if (player.isUCExempt) ucExemptCount++;
        });
      });

      // Prize pool includes UC-exempt as if they paid
      const prizePool = entryFee * totalParticipants;

      // Get team type from poll (if exists)
      const poll = await prisma.poll.findUnique({
        where: { tournamentId: id },
        select: { teamType: true },
      });

      // Import getFinalDistribution dynamically to get adjusted org/fund
      const { getFinalDistribution, getTeamSize } = await import("@/src/utils/prizeDistribution");
      const teamSize = getTeamSize(poll?.teamType || "DUO");
      const distribution = getFinalDistribution(prizePool, entryFee, teamSize, ucExemptCount);

      // Add repeat winner tax contributions to fund and org
      const fundWithTax = distribution.finalFundAmount + taxTotals.fundContribution;
      const orgWithTax = distribution.finalOrgAmount + taxTotals.orgContribution;

      // Create Fund Income record (includes repeat winner tax)
      if (fundWithTax > 0) {
        await prisma.income.create({
          data: {
            amount: fundWithTax,
            description: taxTotals.fundContribution > 0
              ? `Fund - ${tournament.name} (incl. ₹${taxTotals.fundContribution} repeat winner tax)`
              : `Fund - ${tournament.name}`,
            tournamentId: id,
            tournamentName: tournament.name,
            createdBy: "system",
          },
        });
      }

      // Create Org Income record (includes repeat winner tax)
      if (orgWithTax > 0) {
        await prisma.income.create({
          data: {
            amount: orgWithTax,
            description: taxTotals.orgContribution > 0
              ? `Org - ${tournament.name} (incl. ₹${taxTotals.orgContribution} repeat winner tax)`
              : `Org - ${tournament.name}`,
            tournamentId: id,
            tournamentName: tournament.name,
            createdBy: "system",
          },
        });
      }
    }

    // Process solo tax distribution (60% to losers, 40% to bonus pool)
    const totalSoloTax = allSoloTaxResults.reduce((sum, r) => sum + r.taxAmount, 0);

    if (totalSoloTax > 0 && tournament.seasonId) {
      const taxDist = getTaxDistribution(totalSoloTax);

      // Get top 3 loser tiers from the season
      const loserTiers = await getPlayerLosses(tournament.seasonId);

      if (loserTiers.length > 0 && taxDist.loserAmount > 0) {
        // Calculate tier-based distribution
        const tierDistribution = calculateTierDistribution(taxDist.loserAmount, loserTiers);

        // Get winner names for transaction message
        const soloWinnerNames = await Promise.all(
          allSoloTaxResults.map(async (r) => {
            const player = await prisma.player.findUnique({
              where: { id: r.playerId },
              include: { user: { select: { userName: true } } },
            });
            return player?.user.userName || "Unknown";
          })
        );
        const winnerNamesStr = soloWinnerNames.join(", ");

        // Distribute to each tier
        for (const tier of tierDistribution) {
          if (tier.perPlayer > 0) {
            for (const loserId of tier.playerIds) {
              // Get loser's user info
              const loser = await prisma.player.findUnique({
                where: { id: loserId },
                include: { user: true },
              });

              if (!loser) continue;

              // Update UC balance
              await prisma.uC.upsert({
                where: { playerId: loserId },
                create: {
                  player: { connect: { id: loserId } },
                  user: { connect: { id: loser.user.id } },
                  balance: tier.perPlayer,
                },
                update: { balance: { increment: tier.perPlayer } },
              });

              // Create support transaction
              await prisma.transaction.create({
                data: {
                  amount: tier.perPlayer,
                  type: "credit",
                  description: getLoserSupportMessage(winnerNamesStr, tournament.name),
                  playerId: loserId,
                },
              });
            }
          }
        }
      }

      // Add 40% to solo tax pool for next tournament
      if (taxDist.poolAmount > 0) {
        await addToSoloTaxPool(tournament.seasonId, taxDist.poolAmount);
      }
    }

    return SuccessResponse({
      message: "Tournament winners declared and UC distributed successfully",
      data: winnerTeam,
    });
  } catch (error) {
    return handleApiErrors(error);
  }
}

// Helper function for ordinal numbers
function getOrdinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}


