import z from "zod";

export const addPlayerSchema = z.object({
  playerId: z.uuid("Invalid player id"),
  matchId: z.uuid("Invalid match id"),
});
