import { Prisma } from "@/src/lib/db/prisma/generated/prisma";

export type PollT = Prisma.PollGetPayload<{
  include: { options: true; tournament: true };
}>;
