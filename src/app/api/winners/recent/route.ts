import { SuccessResponse, ErrorResponse, CACHE } from "@/lib/api-response";
import pg from "pg";

const V1_DATABASE_URL = "postgresql://postgres.jxoeyaonjosetunwvvym:123Clashofclan@@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true";

/**
 * GET /api/winners/recent
 * Fetches winners data from v1 database directly (team-player links exist there).
 */
export async function GET() {
    const client = new pg.Client({ connectionString: V1_DATABASE_URL });

    try {
        await client.connect();

        // Get tournaments with winners and player names
        const result = await client.query(`
            SELECT 
                t."id" as "tournamentId",
                t."name" as "tournamentName",
                t."createdAt",
                tw."position",
                tw."amount",
                team."name" as "teamName",
                COALESCE(
                    ARRAY_AGG(COALESCE(u."displayName", u."userName") ORDER BY u."userName") 
                    FILTER (WHERE u."id" IS NOT NULL),
                    ARRAY[]::text[]
                ) as "playerNames"
            FROM "TournamentWinner" tw
            JOIN "Tournament" t ON t."id" = tw."tournamentId"
            JOIN "Team" team ON team."id" = tw."teamId"
            LEFT JOIN "_PlayerToTeam" pt ON pt."B" = tw."teamId"
            LEFT JOIN "Player" p ON p."id" = pt."A"
            LEFT JOIN "User" u ON u."id" = p."userId"
            GROUP BY t."id", t."name", t."createdAt", tw."position", tw."amount", team."name"
            ORDER BY t."createdAt" DESC, tw."position" ASC
        `);

        // Get total funds ("fund" income entries)
        const fundsResult = await client.query(`
            SELECT COALESCE(SUM("amount"), 0) as "totalFunds"
            FROM "Income"
            WHERE "description" ILIKE '%fund%'
        `);

        // Group by tournament
        const tournamentMap = new Map<string, {
            id: string;
            name: string;
            createdAt: string;
            place1: { players: string[] } | null;
            place2: { players: string[] } | null;
            place3: { players: string[] } | null;
        }>();

        for (const row of result.rows) {
            if (!tournamentMap.has(row.tournamentId)) {
                tournamentMap.set(row.tournamentId, {
                    id: row.tournamentId,
                    name: row.tournamentName,
                    createdAt: row.createdAt,
                    place1: null,
                    place2: null,
                    place3: null,
                });
            }
            const t = tournamentMap.get(row.tournamentId)!;
            const placeData = { players: row.playerNames.filter(Boolean) as string[] };
            if (row.position === 1) t.place1 = placeData;
            if (row.position === 2) t.place2 = placeData;
            if (row.position === 3) t.place3 = placeData;
        }

        const tournaments = Array.from(tournamentMap.values());

        // Player placement stats (last 6 tournaments)
        const recentSix = tournaments.slice(0, 6);
        const playerStats: Record<string, {
            name: string;
            firstPlaceCount: number;
            secondPlaceCount: number;
            thirdPlaceCount: number;
        }> = {};

        for (const t of recentSix) {
            const places = [
                { data: t.place1, pos: 1 },
                { data: t.place2, pos: 2 },
                { data: t.place3, pos: 3 },
            ];
            for (const { data, pos } of places) {
                if (!data) continue;
                for (const name of data.players) {
                    if (!playerStats[name]) {
                        playerStats[name] = {
                            name,
                            firstPlaceCount: 0,
                            secondPlaceCount: 0,
                            thirdPlaceCount: 0,
                        };
                    }
                    if (pos === 1) playerStats[name].firstPlaceCount++;
                    if (pos === 2) playerStats[name].secondPlaceCount++;
                    if (pos === 3) playerStats[name].thirdPlaceCount++;
                }
            }
        }

        const playerPlacements = Object.values(playerStats)
            .map((p) => ({
                ...p,
                totalPlacements: p.firstPlaceCount + p.secondPlaceCount + p.thirdPlaceCount,
            }))
            .sort((a, b) => b.totalPlacements - a.totalPlacements || b.firstPlaceCount - a.firstPlaceCount || b.secondPlaceCount - a.secondPlaceCount);

        return SuccessResponse({
            data: {
                tournaments,
                playerPlacements,
                totalFunds: Number(fundsResult.rows[0]?.totalFunds || 0),
            },
            cache: CACHE.MEDIUM,
        });
    } catch (error) {
        return ErrorResponse({ message: "Failed to fetch recent winners", error });
    } finally {
        await client.end();
    }
}
