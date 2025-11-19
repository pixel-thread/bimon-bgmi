import { z } from "zod";

export const authSchema = z.object({
  userName: z.string().min(3).max(20),
});
