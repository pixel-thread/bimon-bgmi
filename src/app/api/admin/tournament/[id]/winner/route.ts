import { prisma } from "@/src/lib/db/prisma";
import { Prisma } from "@/src/lib/db/prisma/generated/prisma";
import { getTournamentById } from "@/src/services/tournament/getTournamentById";
import { getUniqedTournamentWinners } from "@/src/services/winner/getTournamentWinner";
import { getPlayerRecentWins } from "@/src/services/winner/getPlayerRecentWins";
import { getPlayerLosses, isPlayerSolo, addToSoloTaxPool, consumeSoloTaxPool } from "@/src/services/winner/getPlayerLosses";
import { calculatePlayerPoints } from "@/src/utils/calculatePlayersPoints";
import { calculateRepeatWinnerTax, aggregateTaxTotals, TaxResult } from "@/src/utils/repeatWinnerTax";
import { calculateSoloTax, getTaxDistribution, calculateTierDistribution, getLoserSupportMessage, SoloTaxResult } from "@/src/utils/soloTax";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { superAdminMiddleware } from "@/src/utils/middleware/superAdminMiddleware";
import { tokenMiddleware } from "@/src/utils/middleware/tokenMiddleware";
import { ErrorResponse, SuccessResponse } from "@/src/utils/next-response";
import { NextRequest } from "next/server";
import { resetMeritAfterSolo } from "@/src/services/merit/calculateMerit";
import { processReferralCommission } from "@/src/services/referral/processReferralCommission";
import { batchNotifyUCReceived, notifyUCReceived } from "@/src/services/push/sendUCNotification";

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

    // Sort teams using BGMI tiebreaker rules (same as Rankings API)
    // This ensures the order matches what's shown in the Declare Winner modal
    const sortedData = mappedData.sort((a, b) => {
      // Primary: Total points (higher is better)
      if (b.total !== a.total) {
        return b.total - a.total;
      }

      // Count chicken dinners for each team
      const aChickenDinners = teamsStats.filter(s => s.teamId === a.teamId && s.position === 1).length;
      const bChickenDinners = teamsStats.filter(s => s.teamId === b.teamId && s.position === 1).length;

      // Tiebreaker 1: Chicken dinners (higher is better)
      if (bChickenDinners !== aChickenDinners) {
        return bChickenDinners - aChickenDinners;
      }

      // Tiebreaker 2: Placement points (higher is better)
      if (b.pts !== a.pts) {
        return b.pts - a.pts;
      }

      // Tiebreaker 3: Total kills (higher is better)
      if ((b.kills || 0) !== (a.kills || 0)) {
        return (b.kills || 0) - (a.kills || 0);
      }

      // Tiebreaker 4: Last match position (lower is better)
      // Get most recent match position for each team
      const aLastStats = teamsStats
        .filter(s => s.teamId === a.teamId)
        .sort((x, y) => new Date(y.createdAt).getTime() - new Date(x.createdAt).getTime())[0];
      const bLastStats = teamsStats
        .filter(s => s.teamId === b.teamId)
        .sort((x, y) => new Date(y.createdAt).getTime() - new Date(x.createdAt).getTime())[0];

      return (aLastStats?.position || 99) - (bLastStats?.position || 99);
    });

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

    // Prepare winner data for atomic transaction
    interface PlayerPrizeData {
      playerId: string;
      userId: string;
      finalAmount: number;
      prizeDescription: string;
      taxResult: TaxResult;
      soloTaxResult: SoloTaxResult;
      participationAdjustment: number; // +bonus or -penalty from participation
      matchesPlayed: number;
      totalMatches: number;
    }

    interface WinnerTeamData {
      teamId: string;
      amount: number;
      position: number;
      players: PlayerPrizeData[];
    }

    const winnerTeamsData: WinnerTeamData[] = [];

    // Get total matches in tournament for participation calculation
    const totalMatches = await prisma.match.count({
      where: { tournamentId: id },
    });

    // Get matches played per player using TeamPlayerStats
    const playerMatchCounts = await prisma.teamPlayerStats.groupBy({
      by: ['playerId'],
      where: {
        playerId: { in: allWinningPlayerIds },
        teamStats: { tournamentId: id },
      },
      _count: { matchId: true },
    });

    // Build map of playerId -> matchesPlayed
    const matchesPlayedMap = new Map<string, number>();
    for (const record of playerMatchCounts) {
      matchesPlayedMap.set(record.playerId, record._count.matchId);
    }

    // Pre-calculate all prize amounts and collect data BEFORE the transaction
    for (let i = 0; i < placementsToUse.length; i++) {
      const placement = placementsToUse[i];
      const team = sortedData[placement.position - 1]; // position is 1-indexed

      if (!team) continue;

      const playersData: PlayerPrizeData[] = [];

      if (placement.amount > 0 && team.players && team.players.length > 0) {
        const basePerPlayerAmount = Math.floor(placement.amount / team.players.length);

        // Calculate participation-adjusted amounts for this team (50% softened penalty)
        const SOFTENING_FACTOR = 0.5;

        // Get participation rates for all players in team
        interface ParticipationData {
          playerId: string;
          matchesPlayed: number;
          rate: number;
        }

        const participationRates: ParticipationData[] = team.players.map(p => {
          const matchesPlayed = matchesPlayedMap.get(p.id) || 0;
          const rate = totalMatches > 0 ? matchesPlayed / totalMatches : 1;
          return { playerId: p.id, matchesPlayed, rate };
        });

        // Calculate average participation rate for the team
        const averageRate = participationRates.reduce((sum, r) => sum + r.rate, 0) / team.players.length;

        // Calculate adjusted base amounts per player
        const adjustedAmounts = new Map<string, { adjusted: number; adjustment: number }>();
        for (const p of participationRates) {
          const difference = p.rate - averageRate;
          const adjustment = Math.floor(difference * basePerPlayerAmount * SOFTENING_FACTOR);
          adjustedAmounts.set(p.playerId, {
            adjusted: basePerPlayerAmount + adjustment,
            adjustment: adjustment,
          });
        }

        for (const player of team.players) {
          // Get player with user info
          const playerData = await prisma.player.findUnique({
            where: { id: player.id },
            include: { user: true },
          });

          if (!playerData) {
            console.error(`Player not found: ${player.id}`);
            continue;
          }

          // Get participation-adjusted amount
          const participationData = adjustedAmounts.get(player.id) || { adjusted: basePerPlayerAmount, adjustment: 0 };
          const adjustedBase = participationData.adjusted;
          const participationAdjustment = participationData.adjustment;
          const matchesPlayed = matchesPlayedMap.get(player.id) || 0;

          // Check if player voted SOLO
          const isSolo = await isPlayerSolo(player.id, id);

          // Calculate repeat winner tax on the ADJUSTED amount
          const previousWins = playerWinCounts.get(player.id) || 0;
          const totalWinsIncludingCurrent = previousWins + 1;
          const taxResult = calculateRepeatWinnerTax(player.id, adjustedBase, totalWinsIncludingCurrent);

          // Calculate solo tax on top of repeat winner tax
          const soloTaxResult = calculateSoloTax(player.id, taxResult.netAmount, isSolo);

          // Use net amount after both taxes
          const finalAmount = soloTaxResult.netAmount;
          const prizeDescription = `${getOrdinal(placement.position)} Place Prize: ${tournament.name}`;

          playersData.push({
            playerId: player.id,
            userId: playerData.user.id,
            finalAmount,
            prizeDescription,
            taxResult,
            soloTaxResult,
            participationAdjustment,
            matchesPlayed,
            totalMatches,
          });
        }
      }

      winnerTeamsData.push({
        teamId: team.teamId,
        amount: placement.amount,
        position: placement.position,
        players: playersData,
      });
    }

    // Execute ALL winner-related DB operations in a single atomic transaction
    // UC transfers are now DEFERRED - players must claim their rewards via banner
    const winnerTeam = await prisma.$transaction(async (tx) => {
      const createdWinners = [];

      for (const teamData of winnerTeamsData) {
        // Create winner record
        const winTeam = await tx.tournamentWinner.create({
          data: {
            amount: teamData.amount,
            position: teamData.position,
            team: { connect: { id: teamData.teamId } },
            tournament: { connect: { id: id } },
          },
        });

        // Set pending winner rewards for all players in this team (NO UC TRANSFER NOW)
        for (const playerData of teamData.players) {
          // Build prize details for breakdown display
          const prizeDetails = {
            baseShare: Math.floor(teamData.amount / teamData.players.length),
            participationAdj: playerData.participationAdjustment,
            matchesPlayed: playerData.matchesPlayed,
            totalMatches: playerData.totalMatches,
            repeatTax: playerData.taxResult.taxAmount,
            soloTax: playerData.soloTaxResult.taxAmount,
            wasRepeatWinner: playerData.taxResult.winCount > 1,
            wasSolo: playerData.soloTaxResult.isSolo,
          };

          // Set pending reward on player (they must claim it via banner)
          await tx.player.update({
            where: { id: playerData.playerId },
            data: {
              pendingWinnerReward: playerData.finalAmount,
              pendingWinnerPosition: teamData.position,
              pendingWinnerTournament: tournament.name,
              pendingWinnerDetails: prizeDetails,
            },
          });

          // Collect tax results for later processing
          allTaxResults.push(playerData.taxResult);
          if (playerData.soloTaxResult.isSolo) {
            allSoloTaxResults.push(playerData.soloTaxResult);
          }
        }

        // Mark winner as distributed if there were players
        // Note: UC will transfer when player claims, but winner record is created now
        if (teamData.players.length > 0) {
          await tx.tournamentWinner.update({
            where: { id: winTeam.id },
            data: { isDistributed: true },
          });
        }

        createdWinners.push(winTeam);
      }

      return createdWinners;
    }, {
      timeout: 15000, // Reduced timeout since no UC operations
      maxWait: 20000,
    });

    // Send push notifications for prize distributions (after transaction commits)
    // Using batch method with throttling for large winner lists
    const prizeNotifications = winnerTeamsData
      .flatMap(teamData => teamData.players)
      .filter(playerData => playerData.finalAmount > 0)
      .map(playerData => ({
        playerId: playerData.playerId,
        amount: playerData.finalAmount,
        source: playerData.prizeDescription,
      }));

    // Fire and forget - runs in background with batching
    batchNotifyUCReceived(prizeNotifications)
      .catch(err => console.error("Failed to send prize notifications:", err));

    // Mark tournament as completed with winners declared and set to INACTIVE
    await prisma.tournament.update({
      where: { id: id },
      data: {
        isWinnerDeclared: true,
        status: "INACTIVE",
      },
    });

    // Reset merit for solo-restricted players who completed this tournament
    // Find all players who are on teams in this tournament (not just those who played matches)
    // This ensures players who were absent from some matches still get their streak recorded
    const tournamentTeamsForParticipants = await prisma.team.findMany({
      where: { tournamentId: id },
      include: {
        players: {
          select: { id: true },
        },
      },
    });

    // Flatten to get all unique player IDs from all teams
    const tournamentPlayers = tournamentTeamsForParticipants.flatMap(team =>
      team.players.map(p => ({ playerId: p.id }))
    );

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

      // Process referral commission for each tournament participant
      // Increments their tournament count and credits promoter if they hit 5
      await processReferralCommission(playerId);
    }

    // NOTE: Tournament streaks are NOT updated here anymore.
    // Use the separate "Update Streaks" button after declaring winner.
    // This decouples streak logic from winner declaration for better control.

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

        // Check if every tier can distribute at least ₹1 per player
        // If not, redirect 100% to bonus pool instead
        const canDistribute = tierDistribution.every(tier => tier.perPlayer >= 1);

        if (!canDistribute) {
          // Solo tax is too small to distribute meaningfully - add 100% to bonus pool
          // Get solo winner names for donor display
          const soloWinnerDisplayNames = await Promise.all(
            allSoloTaxResults.map(async (r) => {
              const player = await prisma.player.findUnique({
                where: { id: r.playerId },
                include: { user: { select: { displayName: true, userName: true } } },
              });
              return player?.user.displayName || player?.user.userName || "Unknown";
            })
          );
          const donorName = soloWinnerDisplayNames.join(", ");

          // Add the entire solo tax to pool (not just 40%)
          await addToSoloTaxPool(tournament.seasonId, totalSoloTax, donorName);
        } else {
          // Proceed with normal distribution
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

          // Distribute to each tier - SET PENDING SUPPORT (no immediate UC transfer)
          for (const tier of tierDistribution) {
            if (tier.perPlayer > 0) {
              for (const loserId of tier.playerIds) {
                // Set pending solo support on player (they claim on next API call)
                await prisma.player.update({
                  where: { id: loserId },
                  data: {
                    pendingSoloSupport: tier.perPlayer,
                    pendingSoloSupportMsg: getLoserSupportMessage(winnerNamesStr, tournament.name),
                  },
                });
              }
            }
          }

          // Add 40% to solo tax pool for next tournament (only if we distributed)
          if (taxDist.poolAmount > 0) {
            // Get solo winner names for donor display (use displayName for prettier display)
            const soloWinnerDisplayNames = await Promise.all(
              allSoloTaxResults.map(async (r) => {
                const player = await prisma.player.findUnique({
                  where: { id: r.playerId },
                  include: { user: { select: { displayName: true, userName: true } } },
                });
                return player?.user.displayName || player?.user.userName || "Unknown";
              })
            );
            const donorName = soloWinnerDisplayNames.join(", ");
            await addToSoloTaxPool(tournament.seasonId, taxDist.poolAmount, donorName);
          }
        }
      } else if (totalSoloTax > 0 && tournament.seasonId) {
        // No loser tiers available - add 100% to pool
        const soloWinnerDisplayNames = await Promise.all(
          allSoloTaxResults.map(async (r) => {
            const player = await prisma.player.findUnique({
              where: { id: r.playerId },
              include: { user: { select: { displayName: true, userName: true } } },
            });
            return player?.user.displayName || player?.user.userName || "Unknown";
          })
        );
        const donorName = soloWinnerDisplayNames.join(", ");
        await addToSoloTaxPool(tournament.seasonId, totalSoloTax, donorName);
      }
    }

    // Consume the solo tax bonus pool (reset to 0) - this pool was already added to prize distribution on the client
    if (tournament.seasonId) {
      await consumeSoloTaxPool(tournament.seasonId);
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


