import { Prisma } from "@prisma/client";

// ─── Player Types ───

export type PlayerT = Prisma.PlayerGetPayload<{
    include: { user: true; stats: true; ban: true };
}>;

export type PlayerWithStatsT = Prisma.PlayerGetPayload<{
    include: { user: true; stats: true };
}>;

export type PlayerWithWeightT = PlayerWithStatsT & {
    weightedScore: number;
};

export type PlayerStatsT = Prisma.PlayerStatsGetPayload<{
    include: { matches: true };
}>;

// ─── Tournament Types ───

export type TournamentT = Prisma.TournamentGetPayload<{
    include: { pollVote: true };
}>;

export type TournamentWithTeamsT = Prisma.TournamentGetPayload<{
    include: { teams: { include: { players: true } }; pollVote: true };
}>;

// ─── Wallet Types ───

export type WalletT = Prisma.WalletGetPayload<{}>;

// ─── User Types ───

export type UserWithPlayerT = Prisma.UserGetPayload<{
    include: { player: { include: { wallet: true } } };
}>;
