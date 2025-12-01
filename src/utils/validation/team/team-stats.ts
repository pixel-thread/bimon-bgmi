import z from "zod";

export const playerTeamStatsSchema = z.object({
  playerId: z.uuid("Player ID is not valid"),
  deaths: z.coerce.number().optional().default(1),
  kills: z.coerce.number().optional(),
  name: z.string().optional(),
});

export const teamStatsSchema = z.object({
  players: z.array(playerTeamStatsSchema, "Players are not valid"),
  position: z.coerce.number().optional(),
  teamId: z.uuid("Team ID is not valid"),
});

export type TeamStatsForm = z.infer<typeof teamStatsSchema>;

export const teamsStatsSchema = z.object({
  tournamentId: z.uuid("Tournament ID is not valid"),
  matchId: z.uuid("Match ID is not valid"),
  stats: z.array(teamStatsSchema, "Stats are not valid"),
});

export type TeamsStatsSchemaT = z.infer<typeof teamsStatsSchema>;
