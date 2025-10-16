import { prisma } from "@/src/lib/db/prisma";

type Props = {
  id: string;
};
export async function togglePollStatus({ id }: Props) {
  const poll = await prisma.poll.findUnique({
    where: { id: id },
  });
  return await prisma.poll.update({
    where: { id: id },
    data: { isActive: poll?.isActive ? false : true },
  });
}
