"use client";
import { useState, useEffect, useCallback } from "react";
import { PlayerWithStats } from "../types";

export function usePlayerData(selectedSeason: string) {
  const [players, setPlayers] = useState<PlayerWithStats[]>([]);

  return {
    players,
    isLoading: false,
    refetch: async () => {},
    addPlayer: () => {},
    updatePlayer: () => {},
    deletePlayer: () => {},
    banPlayer: () => {},
    unbanPlayer: () => {},
  };
}
