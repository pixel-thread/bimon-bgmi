import { Prisma, TeamPlayerStats } from "@/src/lib/db/prisma/generated/prisma";

type PlayerT = {
  id: string;
  name: string;
  category: number;
};

export type TeamT = {
  id: string;
  name: string;
  position: number;
  kills: number;
  deaths: number;
  size: number;
  slotNo: number;
  players: PlayerT[];
  pts: number;
  total: number;
  teamPlayerStats: TeamPlayerStats[];
};

export type TeamStatsT = Prisma.TeamStatsGetPayload<{
  include: {
    team: { include: { players: { include: { user: true } } } };
  };
}>;
