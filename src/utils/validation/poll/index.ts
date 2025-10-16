import z from "zod";

const options = z.object({
  name: z.string(),
  vote: z.enum(["IN", "OUT", "SOLO"]),
});

export const pollSchema = z.object({
  id: z.uuid(),
  options: z.array(options),
  endDate: z.coerce.date().optional(),
  question: z.string(),
  tournamentId: z.string(),
  days: z.string(),
});

export const playerVoteSchema = z.object({
  playerId: z.uuid().optional(),
  vote: z.enum(["IN", "OUT", "SOLO"]),
  pollId: z.string().optional(),
});
