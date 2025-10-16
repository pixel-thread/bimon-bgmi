import { prisma } from "@/src/lib/db/prisma";
import { Prisma } from "@/src/lib/db/prisma/generated/prisma";

type Props = {
  id: string;
  data: Prisma.PollUpdateInput;
};

export async function updatePollById({ id, data }: Props) {
  return await prisma.poll.update({
    where: { id: id },
    data,
  });
}
