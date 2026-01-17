import z from "zod";

export const seasonSchema = z.object({
  name: z.string().min(3),
  description: z.string().nullable().optional(),
});

export type SeasonSchemaType = z.infer<typeof seasonSchema>;
