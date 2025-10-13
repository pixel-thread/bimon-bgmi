import { z } from "zod";

const CATEGORY: string[] = ["ULTRA_NOOB", "NOOB", "PRO", "ULTRA_PRO"];
export const registerSchema = z.object({
  id: z.string().optional(),
  email: z.email(),
  userName: z.string(),
  category: z.enum(CATEGORY).optional(),
  password: z.string(),
});
