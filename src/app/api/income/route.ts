import { prisma } from "@/lib/database";
import { SuccessResponse, ErrorResponse, CACHE } from "@/lib/api-response";
import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

/**
 * GET /api/income?seasonId=xxx
 * Fetches income records + org deductions for a specific season.
 * Shows true org profit/loss after all expenses.
 */
export async function GET(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return ErrorResponse({ message: "Unauthorized", status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { clerkId: userId },
            select: { role: true },
        });

        if (!user || !["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
            return ErrorResponse({ message: "Forbidden", status: 403 });
        }

        // Get seasonId from query params
        const { searchParams } = new URL(request.url);
        let seasonId = searchParams.get("seasonId");

        // Default to latest season
        if (!seasonId) {
            const latest = await prisma.season.findFirst({
                orderBy: { createdAt: "desc" },
                select: { id: true },
            });
            seasonId = latest?.id ?? null;
        }

        if (!seasonId) {
            return SuccessResponse({
                data: { records: [], summary: { totalOrgIncome: 0, totalDeductions: 0, netProfit: 0, deductions: [] } },
            });
        }

        // Get tournaments for this season
        const tournaments = await prisma.tournament.findMany({
            where: { seasonId },
            select: { id: true, name: true, fee: true },
        });
        const tournamentIds = tournaments.map((t) => t.id);
        const tournamentNames = tournaments.map((t) => t.name);

        // Income records for this season's tournaments
        const income = await prisma.income.findMany({
            where: {
                isSubIncome: false,
                tournamentId: { in: tournamentIds },
                description: { startsWith: "Org" },
            },
            include: {
                children: {
                    select: { id: true, amount: true, description: true },
                    orderBy: { createdAt: "asc" },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        const records = income.map((i) => ({
            id: i.id,
            amount: i.amount,
            description: i.description,
            tournamentName: i.tournamentName,
            isSubIncome: i.isSubIncome,
            createdAt: i.createdAt,
            children: i.children,
        }));

        // Total org income (only "Org" records)
        const totalOrgIncome = records
            .filter((r) => r.description.toLowerCase().startsWith("org"))
            .reduce((sum, r) => sum + r.amount, 0);

        // Deductions from CREDIT transactions for season tournaments
        const allCredits = await prisma.transaction.findMany({
            where: { type: "CREDIT" },
            select: { amount: true, description: true, playerId: true },
        });

        const deductions: { category: string; total: number; count: number }[] = [];

        // RP Rewards (streak)
        let rpRewardTotal = 0, rpRewardCount = 0;
        for (const tx of allCredits) {
            if (tx.description.toLowerCase().includes("streak")) {
                rpRewardTotal += tx.amount;
                rpRewardCount++;
            }
        }
        if (rpRewardTotal > 0) deductions.push({ category: "RP Rewards", total: rpRewardTotal, count: rpRewardCount });

        // Promotions
        let promoTotal = 0, promoCount = 0;
        for (const tx of allCredits) {
            const d = tx.description.toLowerCase();
            if (d.includes("promo") && !d.includes("razorpay")) {
                promoTotal += tx.amount;
                promoCount++;
            }
        }
        if (promoTotal > 0) deductions.push({ category: "Promotions", total: promoTotal, count: promoCount });

        // Referral Bonus
        let refTotal = 0, refCount = 0;
        for (const tx of allCredits) {
            const d = tx.description.toLowerCase();
            if (d.includes("referral") || d.includes("refer")) {
                refTotal += tx.amount;
                refCount++;
            }
        }
        if (refTotal > 0) deductions.push({ category: "Referral Bonus", total: refTotal, count: refCount });

        // Bonus (exclude streak — already counted as RP Rewards, and exclude referral)
        let bonusTotal = 0, bonusCount = 0;
        for (const tx of allCredits) {
            const d = tx.description.toLowerCase();
            if (d.includes("bonus") && !d.includes("referral") && !d.includes("refer") && !d.includes("streak")) {
                bonusTotal += tx.amount;
                bonusCount++;
            }
        }
        if (bonusTotal > 0) deductions.push({ category: "Bonus", total: bonusTotal, count: bonusCount });

        // Lucky Voters for this season
        const luckyPolls = await prisma.poll.findMany({
            where: {
                luckyVoterId: { not: null },
                tournamentId: { in: tournamentIds },
            },
            select: { tournament: { select: { fee: true } } },
        });
        const luckyTotal = luckyPolls.reduce((sum, p) => sum + (p.tournament?.fee ?? 0), 0);
        if (luckyTotal > 0) deductions.push({ category: "Lucky Voters", total: luckyTotal, count: luckyPolls.length });

        // Royal Pass purchase income
        const rpPurchases = await prisma.royalPass.aggregate({
            where: { seasonId, pricePaid: { gt: 0 } },
            _sum: { pricePaid: true },
            _count: true,
        });
        const rpIncome = rpPurchases._sum.pricePaid ?? 0;
        const rpPurchaseCount = rpPurchases._count ?? 0;

        deductions.sort((a, b) => b.total - a.total);
        const totalDeductions = deductions.reduce((sum, d) => sum + d.total, 0);
        const netProfit = totalOrgIncome + rpIncome - totalDeductions;

        return SuccessResponse({
            data: {
                records,
                summary: {
                    totalOrgIncome,
                    rpIncome,
                    rpPurchaseCount,
                    totalDeductions,
                    netProfit,
                    deductions,
                },
            },
            cache: CACHE.MEDIUM,
        });
    } catch (error) {
        return ErrorResponse({ message: "Failed to fetch income", error });
    }
}
