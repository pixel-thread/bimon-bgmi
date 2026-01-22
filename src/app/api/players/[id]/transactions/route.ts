import { prisma } from "@/src/lib/db/prisma";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { SuccessResponse } from "@/src/utils/next-response";
import { NextRequest } from "next/server";

// Combined transaction type for UI
interface CombinedTransaction {
    id: string;
    playerId: string;
    amount: number;
    type: "credit" | "debit";
    description: string;
    timestamp: Date;
    source: "transaction" | "uc_transfer";
}

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const playerId = (await params).id;
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const seasonId = searchParams.get("season") || "";

        // Get season date range for filtering (if season specified)
        let seasonDateFilter: { gte?: Date; lte?: Date } | undefined;
        if (seasonId && seasonId !== "lifetime") {
            const season = await prisma.season.findUnique({
                where: { id: seasonId },
                select: { startDate: true, endDate: true },
            });
            if (season) {
                seasonDateFilter = {
                    gte: season.startDate,
                    ...(season.endDate ? { lte: season.endDate } : {}),
                };
            }
        }

        // Fetch all transactions and UC transfers for accurate total count
        const [transactions, ucTransfersReceived, ucTransfersSent] = await Promise.all([
            prisma.transaction.findMany({
                where: {
                    playerId,
                    ...(seasonDateFilter ? { timestamp: seasonDateFilter } : {}),
                },
                orderBy: { timestamp: "desc" },
            }),
            // UC transfers where this player received UC
            prisma.uCTransfer.findMany({
                where: {
                    toPlayerId: playerId,
                    status: "COMPLETED",
                    ...(seasonDateFilter ? { createdAt: seasonDateFilter } : {}),
                },
                include: {
                    fromPlayer: {
                        include: { user: { select: { userName: true, displayName: true } } }
                    }
                },
                orderBy: { createdAt: "desc" },
            }),
            // UC transfers where this player sent UC
            prisma.uCTransfer.findMany({
                where: {
                    fromPlayerId: playerId,
                    status: "COMPLETED",
                    ...(seasonDateFilter ? { createdAt: seasonDateFilter } : {}),
                },
                include: {
                    toPlayer: {
                        include: { user: { select: { userName: true, displayName: true } } }
                    }
                },
                orderBy: { createdAt: "desc" },
            }),
        ]);

        // Convert regular transactions to combined format
        const transactionItems: CombinedTransaction[] = transactions.map(t => ({
            id: t.id,
            playerId: t.playerId,
            amount: t.amount,
            type: t.type as "credit" | "debit",
            description: t.description,
            timestamp: t.timestamp,
            source: "transaction" as const,
        }));

        // Convert received UC transfers to combined format (credit)
        const receivedItems: CombinedTransaction[] = ucTransfersReceived.map(t => ({
            id: `uc-recv-${t.id}`,
            playerId: playerId,
            amount: t.amount,
            type: "credit" as const,
            description: `UC received from ${t.fromPlayer.user.displayName || t.fromPlayer.user.userName}${t.message ? `: "${t.message}"` : ""}`,
            timestamp: t.createdAt,
            source: "uc_transfer" as const,
        }));

        // Convert sent UC transfers to combined format (debit)
        const sentItems: CombinedTransaction[] = ucTransfersSent.map(t => ({
            id: `uc-sent-${t.id}`,
            playerId: playerId,
            amount: t.amount,
            type: "debit" as const,
            description: `UC sent to ${t.toPlayer.user.displayName || t.toPlayer.user.userName}${t.message ? `: "${t.message}"` : ""}`,
            timestamp: t.createdAt,
            source: "uc_transfer" as const,
        }));

        // Combine all items
        const allItems = [...transactionItems, ...receivedItems, ...sentItems];

        // Sort by timestamp descending (newest first)
        allItems.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        // Calculate total and apply pagination
        const total = allItems.length;
        const skip = (page - 1) * limit;
        const paginatedItems = allItems.slice(skip, skip + limit);

        return SuccessResponse({
            data: {
                transactions: paginatedItems,
                pagination: {
                    total,
                    pages: Math.ceil(total / limit),
                    page,
                    limit,
                },
            },
        });
    } catch (error) {
        return handleApiErrors(error);
    }
}
