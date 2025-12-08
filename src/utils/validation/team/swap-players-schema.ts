import z from "zod";

export const swapPlayersSchema = z.object({
    teamAId: z.uuid("Invalid team A id"),
    playerAId: z.uuid("Invalid player A id"),
    teamBId: z.uuid("Invalid team B id"),
    playerBId: z.uuid("Invalid player B id"),
    matchId: z.uuid("Invalid match id"),
});
