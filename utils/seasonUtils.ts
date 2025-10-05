import {
  collection,
  getDocs,
  doc,
  updateDoc,
  setDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Season } from "@/lib/types";

/**
 * Ensures only one season is active at a time
 * When activating a new season, sets endDate for the previously active season
 */
export async function ensureSingleActiveSeason(
  activeSeasonId: string
): Promise<void> {
  try {
    const seasonsSnapshot = await getDocs(collection(db, "seasons"));
    const currentDate = new Date().toISOString().split("T")[0];

    const updatePromises = seasonsSnapshot.docs.map((doc) => {
      const seasonData = doc.data() as Season;
      const isTargetSeason = doc.id === activeSeasonId;

      if (isTargetSeason) {
        // Activate the target season and remove endDate if it exists
        return updateDoc(doc.ref, {
          isActive: true,
          endDate: null, // Remove endDate for active season
        });
      } else if (seasonData.isActive) {
        // Deactivate previously active season and set endDate
        return updateDoc(doc.ref, {
          isActive: false,
          endDate: currentDate, // Set endDate to today
        });
      } else {
        // Season is already inactive, no changes needed
        return Promise.resolve();
      }
    });

    await Promise.all(updatePromises);
  } catch (error) {
    console.error("Error ensuring single active season:", error);
    throw error;
  }
}

/**
 * Creates a new season and properly handles the transition from the previous active season
 */
export async function createNewSeason(
  seasonData: Omit<Season, "id" | "createdAt" | "isActive">
): Promise<Season> {
  try {
    // Generate a unique ID for the new season
    const seasonId = `season_${Date.now()}`;

    const newSeason: Season = {
      ...seasonData,
      id: seasonId,
      isActive: true,
      createdAt: new Date().toISOString(),
      // Don't set endDate for new active season
    };

    // Create the new season
    await setDoc(doc(db, "seasons", seasonId), newSeason);

    // Ensure only this season is active (this will set endDate for previous active season)
    await ensureSingleActiveSeason(seasonId);

    return newSeason;
  } catch (error) {
    console.error("Error creating new season:", error);
    throw error;
  }
}


/**
 * Gets the currently active season
 */
export async function getCurrentActiveSeason(): Promise<Season | null> {
  try {
    const seasonsSnapshot = await getDocs(collection(db, "seasons"));

    for (const doc of seasonsSnapshot.docs) {
      const seasonData = doc.data() as Season;
      if (seasonData.isActive) {
        return { ...seasonData, id: doc.id };
      }
    }

    return null; // No active season found
  } catch (error) {
    console.error("Error getting current active season:", error);
    throw error;
  }
}

/**
 * Fixes existing seasons to remove endDate from active seasons
 * Run this once to clean up existing data
 */
export async function fixExistingActiveSeasons(): Promise<void> {
  try {
    const seasonsSnapshot = await getDocs(collection(db, "seasons"));

    const updatePromises = seasonsSnapshot.docs.map((doc) => {
      const seasonData = doc.data() as Season;

      if (seasonData.isActive && seasonData.endDate) {
        // Remove endDate from active seasons
        return updateDoc(doc.ref, { endDate: null });
      }

      return Promise.resolve();
    });

    await Promise.all(updatePromises);
    console.log(
      "Fixed existing active seasons - removed endDate from active seasons"
    );
  } catch (error) {
    console.error("Error fixing existing active seasons:", error);
    throw error;
  }
}
