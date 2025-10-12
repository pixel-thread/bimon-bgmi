import { create } from "zustand";

type UseTournamentStore = {
  tournamentId: string;
  setTournamentId: (id: string) => void;
};

export const useTournamentStore = create<UseTournamentStore>((set) => ({
  tournamentId: "",
  setTournamentId: (id: string) => set({ tournamentId: id }),
}));
