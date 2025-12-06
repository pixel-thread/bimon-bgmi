import { create } from "zustand";

type UseMatchStore = {
  matchId: string; // 'all' or a match id
  matchNumber: number | null; // 1-based number for label stability
  setMatchId: (id: string) => void; // backward compatibility
  setMatch: (id: string, number: number | null) => void;
};

export const useMatchStore = create<UseMatchStore>((set) => ({
  matchId: "all",
  matchNumber: null,
  setMatchId: (id: string) => set({ matchId: id, matchNumber: id === "all" ? null : null }),
  setMatch: (id: string, number: number | null) => set({ matchId: id, matchNumber: number }),
}));

