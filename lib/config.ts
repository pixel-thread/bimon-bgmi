//lib/config.ts
import { db } from "./firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

// Export the interface
export interface TournamentConfig {
  startDate: string;
  whatsappGroupLink: string;
  notificationMinutesBefore: number;
  backgroundImage?: string;
}

const DEFAULT_CONFIG: TournamentConfig = {
  startDate: "2025-04-05T10:00:00",
  whatsappGroupLink: "https://chat.whatsapp.com/yourgroup",
  notificationMinutesBefore: 30
};

export const getConfig = async (): Promise<TournamentConfig> => {
  const docRef = doc(db, "configuration", "tournament");
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? docSnap.data() as TournamentConfig : DEFAULT_CONFIG;
};

export const updateConfig = async (config: Partial<TournamentConfig>): Promise<void> => {
  const docRef = doc(db, "configuration", "tournament");
  const currentConfig = await getConfig();
  await setDoc(docRef, { ...currentConfig, ...config }, { merge: true });
};