import z from "zod";

export const seasonSchema = z.object({
  name: z.string().min(3),
  description: z.string().nullable().optional(),
  startDate: z.preprocess((val) => new Date(val as string), z.date()),
  endDate: z.preprocess((val) => new Date(val as string), z.date()).optional(),
});

export type SeasonSchemaType = z.infer<typeof seasonSchema>;
