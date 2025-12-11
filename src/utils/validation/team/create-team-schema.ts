import z from "zod";
import { addPlayerSchema } from "./add-player";

export const createTeamSchema = z.object({
  players: z.array(addPlayerSchema.pick({ playerId: true, moveFromTeamId: true })),
  tournamentId: z.uuid(),
  matchId: z.uuid(),
  deductUC: z.boolean().optional().default(false),
});
