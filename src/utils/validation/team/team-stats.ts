import z from "zod";

const playerStatsSchema = z.object({
  playerId: z.uuid("player id is not valid"),
  wins: z.number().optional(),
  wind2nd: z.number().optional(),
  deaths: z.number("Deaths is not valid"),
  kills: z.number("Kills is not valid"),
});

export const teamStatsSchema = z.object({
  matchId: z.uuid("match id is not valid"),
  players: z.array(playerStatsSchema, "Players are not valid"),
});
