import z from "zod";

export const addPlayerSchema = z.object({
  playerId: z.uuid("Invalid player id"),
  matchId: z.uuid("Invalid match id"),
  deductUC: z.boolean().optional().default(false),
  moveFromTeamId: z.uuid("Invalid team id").optional(), // When moving player from another team
});
