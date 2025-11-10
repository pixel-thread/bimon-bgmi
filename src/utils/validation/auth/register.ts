import { PLAYER_CATEGORY } from "@/src/lib/constant/player-category";
import { z } from "zod";

export const registerSchema = z.object({
  id: z.string().optional(),
  email: z.email(),
  userName: z.string(),
  category: z.enum(PLAYER_CATEGORY).optional(),
  password: z.string(),
});
