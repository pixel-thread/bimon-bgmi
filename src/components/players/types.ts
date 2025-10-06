import { Player } from "@/src/lib/types";

export interface PlayerWithStats extends Player {
  matchesPlayed: number;
  totalKills: number;
  overallKD: number;
  avgKillsPerMatch: number;
}

export interface PlayersTabProps {
  readOnly?: boolean;
  hideCsvExport?: boolean;
  showBalanceSummary?: boolean;
}

export interface BalanceHistory {
  id: string;
  playerId: string;
  playerName: string;
  amount: number;
  type: "credit" | "debit";
  description: string;
  timestamp: string;
}

export interface BalanceAdjustment {
  amount: string;
  reason: string;
  type: "credit" | "debit";
}
