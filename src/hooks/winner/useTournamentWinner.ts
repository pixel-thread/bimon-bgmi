import { WINNER_ENDPOINTS } from "@/src/lib/endpoints/winner";
import http from "@/src/utils/http";
import { useQuery } from "@tanstack/react-query";

export type PlayerPlacement = {
  playerName: string;
  firstPlaceCount: number;
  secondPlaceCount: number;
  totalPlacements: number;
};

export type RecentTournament = {
  tournamentId: string;
  tournamentName: string;
  firstPlace: string[];
  secondPlace: string[];
};

export type WinnerData = {
  tournaments: Array<{
    tournamentId: string;
    tournamentName: string;
    place1: { teamName: string } | null;
    place2: { teamName: string } | null;
  }>;
  recentStats: {
    playerPlacements: PlayerPlacement[];
    recentTournaments: RecentTournament[];
  };
};

type Props = {
  seasonId: string;
};

export function useTournamentWinner({ seasonId }: Props) {
  return useQuery({
    queryKey: ["tournament-winner", seasonId],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    select: (data: any) => data.data as WinnerData,
    enabled: !!seasonId,
    queryFn: () =>
      http.post(WINNER_ENDPOINTS.POST_GET_TOURNAMENT_WINNER_BY_SEASON, {
        seasonId: seasonId,
      }),
  });
}



