import { TournamentConfig } from "@/lib/types";

export interface BanInfo {
  isBanned: boolean;
  banDuration?: number;
  bannedAt?: string;
  remainingDuration?: number;
  isExpired: boolean;
}

/**
 * Calculate remaining ban duration for a player
 * @param player - The player object with ban information
 * @param tournaments - Array of all tournaments
 * @returns BanInfo object with remaining duration and expiration status
 */
export function calculateRemainingBanDuration(
  player: { isBanned?: boolean; banDuration?: number; bannedAt?: string },
  tournaments: TournamentConfig[]
): BanInfo {
  if (!player.isBanned || !player.banDuration || !player.bannedAt) {
    return {
      isBanned: false,
      isExpired: false,
    };
  }

  const banDate = new Date(player.bannedAt);
  const tournamentsSinceBan = tournaments.filter(
    (tournament) => tournament.createdAt && new Date(tournament.createdAt) > banDate
  );

  const remainingDuration = Math.max(0, player.banDuration - tournamentsSinceBan.length);
  const isExpired = remainingDuration <= 0;

  return {
    isBanned: true,
    banDuration: player.banDuration,
    bannedAt: player.bannedAt,
    remainingDuration,
    isExpired,
  };
}

/**
 * Format remaining ban duration for display
 * @param remainingDuration - Number of tournaments remaining
 * @returns Formatted string
 */
export function formatRemainingBanDuration(remainingDuration: number): string {
  if (remainingDuration <= 0) {
    return "Expired";
  }
  
  if (remainingDuration === 1) {
    return "1 tournament";
  }
  
  return `${remainingDuration} tournaments`;
}
