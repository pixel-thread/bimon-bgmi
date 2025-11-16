export type SeedUserT = {
  id: string;
  playerName: string;
  userName: string | null;
  email: string | null;
  clerkId: string | null;
  role: string | null;
  isEmailLinked: boolean;
  isVerified: boolean;
  player: {
    id: string;
    userId: string;
    category: string;
    isBanned: boolean;
    name: string;
  };
  stats: {
    season: number;
    playerId: string;
    kills: number;
    deaths: number;
    kdRatio: number;
  }[];
  balance: number;
  matchesPlayed: {
    season: number;
    matchesPlayed: number;
  }[];
};
