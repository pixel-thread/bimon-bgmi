import { Prisma } from "@/src/lib/db/prisma/generated/prisma";

export type TournamentT = Prisma.TournamentGetPayload<{
  include: { pollVote: true };
}>;
