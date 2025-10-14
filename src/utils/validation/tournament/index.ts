import z from "zod";

export const tournamentSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3),
  startDate: z
    .preprocess((val) => new Date(val as string), z.date())
    .optional(),
  fee: z.coerce.number().min(0).optional(),
  backgroundUrl: z.url().optional(),
});
