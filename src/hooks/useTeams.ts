// hooks/useTeams.ts
import { useState, useEffect } from "react";
import { db } from "@/src/lib/firebase";
import {
  collection,
  onSnapshot,
  writeBatch,
  doc,
  query,
  where,
  FirestoreError,
} from "firebase/firestore";
import { CombinedTeamData } from "@/src/lib/types";

export function useTeams(tournamentId: string | null) {
  const [teams, setTeams] = useState<CombinedTeamData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tournamentId) {
      setTeams([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "tournamentEntries"),
      where("tournamentId", "==", tournamentId)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const teamData: CombinedTeamData[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as CombinedTeamData;
          teamData.push({
            ...data,
            id: docSnap.id,
            matchScores: data.matchScores || {},
          });
        });
        setTeams(teamData);
        setLoading(false);
      },
      (error: FirestoreError) => {
        console.error("Error fetching teams:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [tournamentId]);

  const deleteTeams = async (teamIds: string[]) => {
    const batch = writeBatch(db);
    teamIds.forEach((id) => {
      batch.delete(doc(db, "tournamentEntries", id));
    });
    await batch.commit();
  };

  return { teams, loading, deleteTeams };
}
