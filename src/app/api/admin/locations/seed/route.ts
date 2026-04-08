import { getAuthEmail } from "@/lib/auth";
import { SuccessResponse, ErrorResponse } from "@/lib/api-response";
import { communityDb } from "@/lib/community-db";
import { INDIA_LOCATIONS as DATA } from "@/data/india-locations";

/**
 * POST /api/admin/locations/seed
 * Seeds all Indian states, districts, and HQ towns to the CENTRAL database.
 * Shared across all game deployments (BGMI, MLBB, PES, etc.)
 * Uses batch operations to stay well within Vercel's timeout.
 * Safe to re-run — skips existing records.
 */
export async function POST() {
  try {
    const email = await getAuthEmail();
    if (!email) return ErrorResponse({ message: "Unauthorized", status: 401 });

    // Auth check uses game-specific DB for user role
    const { prisma } = await import("@/lib/database");
    const user = await prisma.user.findFirst({
      where: { OR: [{ email }, { secondaryEmail: email }] },
      select: { role: true },
    });
    if (!user || user.role !== "SUPER_ADMIN") {
      return ErrorResponse({ message: "Super admin only", status: 403 });
    }

    const db = communityDb;

    // ────────────────────────────────────────────────────────
    // Step 1: Fetch all existing states in one query
    // ────────────────────────────────────────────────────────
    const existingStates = await db.centralLocationState.findMany({ select: { id: true, name: true } });
    const stateMap = new Map<string, string>(existingStates.map((s: { name: string; id: string }) => [s.name, s.id]));

    // Insert missing states
    const allStateNames = Object.keys(DATA);
    const missingStates = allStateNames.filter(name => !stateMap.has(name));
    if (missingStates.length > 0) {
      await db.centralLocationState.createMany({
        data: missingStates.map(name => ({ name })),
        skipDuplicates: true,
      });
      const newStates = await db.centralLocationState.findMany({
        where: { name: { in: missingStates } },
        select: { id: true, name: true },
      });
      for (const s of newStates) stateMap.set(s.name, s.id);
    }

    // ────────────────────────────────────────────────────────
    // Step 2: Fetch all existing districts in one query
    // ────────────────────────────────────────────────────────
    const existingDistricts = await db.centralLocationDistrict.findMany({
      select: { id: true, name: true, stateId: true },
    });
    const districtMap = new Map<string, string>(existingDistricts.map((d: { stateId: string; name: string; id: string }) => [`${d.stateId}|${d.name}`, d.id]));

    const districtInserts: { name: string; stateId: string }[] = [];
    for (const [stateName, districts] of Object.entries(DATA)) {
      const stateId: string = stateMap.get(stateName)!;
      for (const districtName of Object.keys(districts)) {
        const key = `${stateId}|${districtName}`;
        if (!districtMap.has(key)) {
          districtInserts.push({ name: districtName, stateId });
        }
      }
    }
    if (districtInserts.length > 0) {
      await db.centralLocationDistrict.createMany({
        data: districtInserts,
        skipDuplicates: true,
      });
      const newDistricts = await db.centralLocationDistrict.findMany({
        where: { id: { not: { in: existingDistricts.map((d: { id: string }) => d.id) } } },
        select: { id: true, name: true, stateId: true },
      });
      for (const d of newDistricts) districtMap.set(`${d.stateId}|${d.name}`, d.id);
    }

    // ────────────────────────────────────────────────────────
    // Step 3: Fetch all existing towns in one query
    // ────────────────────────────────────────────────────────
    const existingTowns = await db.centralLocationTown.findMany({
      select: { id: true, name: true, districtId: true },
    });
    const townSet = new Set(existingTowns.map((t: { districtId: string; name: string }) => `${t.districtId}|${t.name}`));

    const townInserts: { name: string; districtId: string }[] = [];
    for (const [stateName, districts] of Object.entries(DATA)) {
      const stateId: string = stateMap.get(stateName)!;
      for (const [districtName, towns] of Object.entries(districts)) {
        const districtId: string = districtMap.get(`${stateId}|${districtName}`)!;
        for (const townName of towns) {
          const key = `${districtId}|${townName}`;
          if (!townSet.has(key)) {
            townInserts.push({ name: townName, districtId });
          }
        }
      }
    }
    if (townInserts.length > 0) {
      await db.centralLocationTown.createMany({
        data: townInserts,
        skipDuplicates: true,
      });
    }

    const sc = allStateNames.length;
    const dc = Object.values(DATA).reduce((sum, districts) => sum + Object.keys(districts).length, 0);
    const tc = Object.values(DATA).reduce((sum, districts) =>
      sum + Object.values(districts).reduce((s, towns) => s + towns.length, 0), 0);

    return SuccessResponse({
      message: `Seeded ${sc} states, ${dc} districts, ${tc} towns (${missingStates.length} new states, ${districtInserts.length} new districts, ${townInserts.length} new towns) → Central DB`,
    });
  } catch (error) {
    return ErrorResponse({ message: "Failed to seed", error });
  }
}
