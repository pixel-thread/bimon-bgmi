import z from "zod";

const options = z.object({
  name: z.string(),
  vote: z.enum(["IN", "OUT", "SOLO"]),
});

export const pollSchema = z.object({
  options: z.array(options),
  endDate: z.coerce.date(),
  question: z.string(),
  tournamentId: z.string(),
});

export const playerVoteSchema = z.object({
  playerId: z.uuid(),
  vote: z.enum(["IN", "OUT", "SOLO"]),
  pollId: z.string(),
});
