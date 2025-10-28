import z from "zod";

const playerStatsSchema = z.object({
  playerId: z.uuid("Player ID is not valid"),
  wins: z.number().optional(),
  wind2nd: z.number().optional(),
  deaths: z.coerce.number().optional(),
  kills: z.coerce.number().optional(),
  name: z.string().optional(),
});

export const teamStatsSchema = z.object({
  matchId: z.uuid("Match ID is not valid"),
  players: z.array(playerStatsSchema, "Players are not valid"),
  position: z.coerce.number().optional(),
});

export type TeamStatsForm = z.infer<typeof teamStatsSchema>;
