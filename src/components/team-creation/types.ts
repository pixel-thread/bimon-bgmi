import { Player, TournamentConfig } from "@/src/lib/types";
import { Team } from "@/src/lib/teamGenerator";
import { TournamentParticipant } from "@/src/lib/tournamentParticipationService";

export const TEAM_MODES = [
  { value: "Solo 1", label: "Solo", description: "Individual players" },
  { value: "Duo 2", label: "Duo", description: "Pairs of two players" },
  { value: "Trio 3", label: "Trio", description: "Teams of three players" },
  { value: "Squad 4", label: "Squad", description: "Teams of four players" },
] as const;

export type TeamMode = (typeof TEAM_MODES)[number]["value"];

export interface PlayersByCategory {
  ultraNoobs: Player[];
  noobs: Player[];
  pros: Player[];
  ultraPros: Player[];
}

export interface TeamCreationModalProps {
  showModal: boolean;
  setShowModal: (show: boolean) => void;
  setShowConfirmModal: (show: boolean) => void;
  setTeamsToCreate: (teams: Team[]) => void;
  selectedTournament?: string | null;
}

export interface PlayerSelectionState {
  selectedUltraNoobs: string[];
  selectedNoobs: string[];
  selectedPros: string[];
  selectedUltraPros: string[];
  selectedSoloPlayers: string[];
  excludedFromDeduction: Set<string>;
}

export interface TeamCreationState {
  players: PlayersByCategory;
  teamMode: TeamMode;
  loading: boolean;
  generating: boolean;
  saving: boolean;
  activeTab: "ultraNoobs" | "noobs" | "pros" | "ultraPros" | "solo";
  tournamentTitle: string | null;
  searchQuery: string;
  savedPlayers: string[];

  playerStats: {
    [playerId: string]: {
      kdRatio: number;
      winRate: number;
      matchesPlayed: number;
    };
  };
  tournamentParticipants: TournamentParticipant[];
}
