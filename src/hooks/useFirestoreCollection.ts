// hooks/useFirestoreCollection.ts
import { useState, useEffect } from "react";
import {
  Firestore,
  collection,
  onSnapshot,
  query,
  QueryDocumentSnapshot,
  FirestoreError,
} from "firebase/firestore";
import { db } from "@/src/lib/firebase"; // Import client-side db

export function useFirestoreCollection<T>(
  db: Firestore,
  collectionName: string,
  refreshTrigger: number
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, collectionName));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items: T[] = [];
        snapshot.forEach((doc: QueryDocumentSnapshot) => {
          items.push({ id: doc.id, ...doc.data() } as T);
        });
        setData(items);
        setLoading(false);
      },
      (error: FirestoreError) => {
        console.error(`Error fetching ${collectionName}:`, error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [db, collectionName, refreshTrigger]);

  return { data, loading };
}
