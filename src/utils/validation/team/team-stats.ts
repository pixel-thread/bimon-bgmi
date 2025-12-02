import z from "zod";

export const playerTeamStatsSchema = z.object({
  playerId: z.uuid("Player ID is not valid"),
  deaths: z
    .number({
      message: "Deaths must be a number",
    })
    .optional()
    .default(1),
  kills: z
    .number({
      message: "Kills must be a number",
    })
    .optional(),
});

export const teamStatsSchema = z.object({
  players: z.array(playerTeamStatsSchema, "Players are not valid"),
  position: z
    .number({
      message: "Position must be a number",
    })
    .optional(),
  teamId: z.uuid("Team ID is not valid"),
});

export type TeamStatsForm = z.infer<typeof teamStatsSchema>;

export const teamsStatsSchema = z.object({
  tournamentId: z.uuid("Tournament ID is not valid"),
  matchId: z.uuid("Match ID is not valid"),
  stats: z.array(teamStatsSchema, "Stats are not valid"),
});

export type TeamsStatsSchemaT = z.infer<typeof teamsStatsSchema>;
