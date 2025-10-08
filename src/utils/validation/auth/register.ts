import { z } from "zod";
import { authSchema } from ".";

const CATEGORY: string[] = ["ULTRA_NOOB", "NOOB", "PRO", "ULTRA_PRO"];
export const registerSchema = z.object({
  email: z.email().optional(),
  userName: z.string(),
  category: z.enum(CATEGORY).optional(),
  password: z.string(),
});
