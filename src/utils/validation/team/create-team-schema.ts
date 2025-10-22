import z from "zod";
import { addPlayerSchema } from "./add-player";

export const createTeamSchema = z.object({
  players: z.array(addPlayerSchema),
  tournamentId: z.uuid(),
});
