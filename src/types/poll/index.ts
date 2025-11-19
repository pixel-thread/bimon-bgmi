import { Prisma } from "@/src/lib/db/prisma/generated/prisma";

export type PollT = Prisma.PollGetPayload<{
  include: { options: true; tournament: true };
}>;

export type PlayerPollVoteT = Prisma.PlayerPollVoteGetPayload<{
  include: {
    player: { include: { user: true; characterImage: true } };
  };
}>;
