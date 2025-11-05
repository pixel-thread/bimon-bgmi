import { create } from "zustand";

type UseSeasonStore = {
  seasonId: string;
  setSeasonId: (id: string) => void;
};

export const useSeasonStore = create<UseSeasonStore>((set) => ({
  seasonId: "",
  setSeasonId: (id: string) => set({ seasonId: id }),
}));
