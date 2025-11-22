import { Prisma } from "@/src/lib/db/prisma/generated/prisma";
import { getAllPlayers } from "@/src/services/player/getAllPlayers";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { SuccessResponse } from "@/src/utils/next-response";
import z from "zod";

const schema = z.object({
  query: z.string().default(""),
});

export async function POST(request: Request) {
  try {
    const { query } = schema.parse(await request.json());

    const where: Prisma.PlayerWhereInput =
      query.trim().length > 0
        ? {
            OR: [
              {
                user: {
                  userName: {
                    contains: query,
                    mode: "insensitive",
                  },
                },
              },
              {
                user: {
                  email: {
                    contains: query,
                    mode: "insensitive",
                  },
                },
              },
            ],
          }
        : {};

    const [players, _] = await getAllPlayers({
      where,
      page: "all",
    });

    return SuccessResponse({
      data: players,
    });
  } catch (error) {
    return handleApiErrors(error);
  }
}
