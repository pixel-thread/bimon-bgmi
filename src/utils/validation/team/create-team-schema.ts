import z from "zod";
import { addPlayerSchema } from "./add-player";

export const createTeamSchema = z.object({
  players: z.array(addPlayerSchema.pick({ playerId: true })),
  tournamentId: z.uuid(),
  matchId: z.uuid(),
});
