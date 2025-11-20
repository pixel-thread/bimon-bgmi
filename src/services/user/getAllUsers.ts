import { prisma } from "@/src/lib/db/prisma";
import { Prisma } from "@/src/lib/db/prisma/generated/prisma";
import { getPagination } from "@/src/utils/pagination";

type Props = {
  where?: Prisma.UserWhereInput;
  page?: string;
};
export async function getAllUsers({ where, page = "1" }: Props = {}) {
  const { take, skip } = getPagination({ page });
  return await prisma.$transaction([
    prisma.user.findMany({ where, take, skip }),
    prisma.user.count({ where }),
  ]);
}
