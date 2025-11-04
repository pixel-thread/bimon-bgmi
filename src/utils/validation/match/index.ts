import z from "zod";

export const matchSchema = z.object({
  tournamentId: z.uuid("Invalid Season ID"),
  seasonId: z.uuid("Invalid Season ID, Please Select an Active Season"),
});
