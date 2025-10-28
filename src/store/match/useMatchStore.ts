import { create } from "zustand";

type UseMatchStore = {
  matchId: string;
  setMatchId: (id: string) => void;
};

export const useMatchStore = create<UseMatchStore>((set) => ({
  matchId: "",
  setMatchId: (id: string) => set({ matchId: id }),
}));
