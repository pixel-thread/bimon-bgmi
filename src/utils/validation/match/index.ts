import z from "zod";

export const matchSchema = z.object({
  tournamentId: z.uuid(),
  seasonId: z.uuid(),
});
