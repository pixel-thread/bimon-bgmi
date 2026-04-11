/* eslint-disable @typescript-eslint/no-explicit-any */
import { PrismaClient } from "@prisma/client";

/**
 * Extract the "base" username by stripping the trailing random digits.
 * Our usernames are: `lowercased_google_name + 4_random_digits`
 * e.g. "milkysyiemunbroken4103" → "milkysyiemunbroken"
 */
function getUsernameBase(username: string): string {
    // Strip trailing digits (the 4-digit random suffix)
    return username.replace(/\d+$/, "");
}

/**
 * Normalize a player pair so the smaller ID is always first.
 * This prevents creating both A→B and B→A alerts.
 */
function normalizePair(id1: string, id2: string): [string, string] {
    return id1 < id2 ? [id1, id2] : [id2, id1];
}

/**
 * Normalize a display name for similarity comparison.
 * Strips special chars, diacritics, emoji, and lowercases.
 * e.g. "tmx♡pukhleiñ" → "tmxpukhlein", "tmxpukhlien" → "tmxpukhlien"
 */
function normalizeDisplayName(name: string): string {
    return name
        .normalize("NFD")                    // decompose diacritics (ñ → n + combining tilde)
        .replace(/[\u0300-\u036f]/g, "")     // strip combining characters
        .replace(/[^a-zA-Z0-9]/g, "")        // strip emoji, symbols, spaces
        .toLowerCase();
}

/**
 * Check a single player against all other players for duplicate signals.
 * Creates DuplicateAlert records for any matches found.
 *
 * Signals:
 *   1. Same phone number
 *   2. Same email ↔ secondary email overlap
 *   3. Same username base (Google name match)
 */
export async function checkPlayerForDuplicates(
    playerId: string,
    db: PrismaClient,
): Promise<number> {
    // Fetch the player + user info
    const player = await db.player.findUnique({
        where: { id: playerId },
        include: {
            user: {
                select: { id: true, email: true, secondaryEmail: true, username: true },
            },
        },
    });

    if (!player || !player.user) return 0;

    const { phoneNumber, displayName } = player;
    const { email, secondaryEmail, username } = player.user;
    const usernameBase = getUsernameBase(username);
    let alertsCreated = 0;

    // ── 1. Phone number match ─────────────────────────────────
    if (phoneNumber) {
        const phoneMatches = await db.player.findMany({
            where: {
                phoneNumber,
                id: { not: playerId },
            },
            select: { id: true, displayName: true },
        });

        for (const match of phoneMatches) {
            const [p1, p2] = normalizePair(playerId, match.id);
            try {
                await db.duplicateAlert.create({
                    data: {
                        player1Id: p1,
                        player2Id: p2,
                        matchType: "PHONE",
                        matchValue: phoneNumber,
                    },
                });
                alertsCreated++;
            } catch {
                // unique constraint violation = already flagged, skip
            }
        }
    }

    // ── 2. Email ↔ Secondary email overlap ────────────────────
    // Check if this user's email matches another user's secondaryEmail
    if (email) {
        const emailMatches = await db.user.findMany({
            where: {
                secondaryEmail: email,
                id: { not: player.user.id },
            },
            include: { player: { select: { id: true } } },
        });

        for (const match of emailMatches) {
            if (!match.player) continue;
            const [p1, p2] = normalizePair(playerId, match.player.id);
            try {
                await db.duplicateAlert.create({
                    data: {
                        player1Id: p1,
                        player2Id: p2,
                        matchType: "EMAIL",
                        matchValue: email,
                    },
                });
                alertsCreated++;
            } catch {
                // already flagged
            }
        }
    }

    // Check if this user's secondaryEmail matches another user's primary email
    if (secondaryEmail) {
        const secMatches = await db.user.findMany({
            where: {
                email: secondaryEmail,
                id: { not: player.user.id },
            },
            include: { player: { select: { id: true } } },
        });

        for (const match of secMatches) {
            if (!match.player) continue;
            const [p1, p2] = normalizePair(playerId, match.player.id);
            try {
                await db.duplicateAlert.create({
                    data: {
                        player1Id: p1,
                        player2Id: p2,
                        matchType: "EMAIL",
                        matchValue: secondaryEmail,
                    },
                });
                alertsCreated++;
            } catch {
                // already flagged
            }
        }
    }

    // ── 3. Username base match ────────────────────────────────
    if (usernameBase && usernameBase.length >= 3) {
        // Find users whose username starts with the same base
        const allUsers = await db.user.findMany({
            where: {
                id: { not: player.user.id },
            },
            select: { id: true, username: true, player: { select: { id: true } } },
        });

        const baseMatches = allUsers.filter((u) => {
            const otherBase = getUsernameBase(u.username);
            return otherBase === usernameBase && otherBase.length >= 3;
        });

        for (const match of baseMatches) {
            if (!match.player) continue;
            const [p1, p2] = normalizePair(playerId, match.player.id);
            try {
                await db.duplicateAlert.create({
                    data: {
                        player1Id: p1,
                        player2Id: p2,
                        matchType: "USERNAME",
                        matchValue: `${username} ↔ ${match.username}`,
                    },
                });
                alertsCreated++;
            } catch {
                // already flagged
            }
        }
    }

    // ── 4. Display name similarity ────────────────────────
    if (displayName && displayName.length >= 3) {
        const normalizedName = normalizeDisplayName(displayName);
        if (normalizedName.length >= 3) {
            const allPlayers = await db.player.findMany({
                where: { id: { not: playerId } },
                select: { id: true, displayName: true },
            });

            const nameMatches = allPlayers.filter((p) => {
                if (!p.displayName) return false;
                const otherNorm = normalizeDisplayName(p.displayName);
                return otherNorm === normalizedName;
            });

            for (const match of nameMatches) {
                const [p1, p2] = normalizePair(playerId, match.id);
                try {
                    await db.duplicateAlert.create({
                        data: {
                            player1Id: p1,
                            player2Id: p2,
                            matchType: "DISPLAY_NAME",
                            matchValue: `${displayName} ↔ ${match.displayName}`,
                        },
                    });
                    alertsCreated++;
                } catch {
                    // already flagged
                }
            }
        }
    }

    return alertsCreated;
}

/**
 * Full scan: check ALL players for duplicates.
 * Used by the admin "Scan All" button.
 */
export async function scanAllPlayersForDuplicates(
    db: PrismaClient,
): Promise<number> {
    const players = await db.player.findMany({
        select: { id: true },
    });

    let total = 0;
    for (const player of players) {
        total += await checkPlayerForDuplicates(player.id, db);
    }
    return total;
}
