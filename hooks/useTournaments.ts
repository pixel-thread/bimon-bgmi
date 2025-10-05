// hooks/useTournaments.ts
import { useMemo } from "react";
import { useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { db } from "@/lib/firebase";
import { doc, setDoc, deleteDoc, getDocs, collection } from "firebase/firestore";
import { TournamentConfig } from "@/lib/types";

export function useTournaments() {
  const { data: tournamentsData } = useFirestoreCollection<TournamentConfig>(db, "tournaments", 0);

  // Memoize tournaments to prevent unnecessary re-renders
  const tournaments = useMemo(() => tournamentsData, [tournamentsData]);

  const createTournament = async (config: TournamentConfig) => {
    // Get active season to link tournament
    const seasonsSnapshot = await getDocs(collection(db, "seasons"));
    const seasons = seasonsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
    const activeSeason = seasons.find((season: any) => season.isActive);
    
    const newConfig = { 
      ...config, 
      id: `tournament_${Date.now()}`,
      createdAt: new Date().toISOString(),
      seasonId: activeSeason?.id || "season_1" // Link to active season or default to season_1
    };
    await setDoc(doc(db, "tournaments", newConfig.id), newConfig);
    return newConfig.id; // Return the new tournament ID
  };

  const updateTournament = async (id: string, config: TournamentConfig) => {
    await setDoc(doc(db, "tournaments", id), config, { merge: true });
  };

  const deleteTournament = async (id: string) => {
    await deleteDoc(doc(db, "tournaments", id));
  };

  return { tournaments, createTournament, updateTournament, deleteTournament };
}