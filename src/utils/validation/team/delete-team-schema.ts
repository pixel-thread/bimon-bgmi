import z from "zod";

export const deleteTeamSchema = z.object({
  tournamentId: z.uuid(),
});
