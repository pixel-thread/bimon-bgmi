import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "./firebase";
import { Player } from "./types";
import { sanitizeDisplayName, toMatchKey } from "./unicodeSanitizer";

// Helper function to escape special characters for regex
function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export class PlayerAuthService {
  private readonly playersCollection = "players";

  /**
   * Validates player credentials by checking name and password against players collection
   * @param name - Player name to validate
   * @param password - Password to validate
   * @returns Player object if credentials are valid, null otherwise
   */
  async validatePlayerCredentials(
    name: string,
    password: string
  ): Promise<Player | null> {
    try {
      // Query for player with exact name match
      const playersRef = collection(db, this.playersCollection);
      const q = query(playersRef, where("name", "==", name));

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return null;
      }

      // Iterate through all matching players to handle duplicate names
      for (const docSnap of querySnapshot.docs) {
        const playerData = { id: docSnap.id, ...docSnap.data() } as Player;

        // Skip deleted players (but allow banned)
        if (playerData.deleted) {
          continue;
        }

        const stored = playerData.loginPassword ?? "";
        if (stored === password || stored.trim() === password.trim()) {
          await this.updateLastLogin(playerData.id);
          return playerData;
        }
      }

      return null;
    } catch (error) {
      console.error("Error validating player credentials:", error);
      throw new Error("Failed to validate player credentials");
    }
  }

  /**
   * Returns filtered player names for autocomplete functionality
   * @param searchQuery - Search query to filter player names
   * @returns Array of players matching the query
   */
  async getPlayerSuggestions(searchQuery: string): Promise<Player[]> {
    try {
      if (!searchQuery || searchQuery.trim().length === 0) {
        return [];
      }

      const playersRef = collection(db, this.playersCollection);
      // Normalize and case-fold the query for Unicode-safe matching
      const lowerQuery = toMatchKey(searchQuery).trim();

      // Query for all players (no login enabled filter)
      const querySnapshot = await getDocs(playersRef);
      const players: Player[] = [];

      querySnapshot.forEach((doc) => {
        const playerData = { id: doc.id, ...doc.data() } as Player;
        // Normalize and case-fold player name
        const playerName = toMatchKey(playerData.name);

        // Skip deleted players (but allow banned players in suggestions)
        if (playerData.deleted) {
          return;
        }

        // More flexible matching: includes, starts with, or contains query
        if (
          playerName.includes(lowerQuery) ||
          playerName.startsWith(lowerQuery) ||
          Array.from(lowerQuery).every((char) => playerName.includes(char))
        ) {
          players.push(playerData);
        }
      });

      // Prioritize matches: exact > starts with > contains > fuzzy
      players.sort((a, b) => {
        const nameA = toMatchKey(a.name);
        const nameB = toMatchKey(b.name);

        // Exact match gets highest priority
        if (nameA === lowerQuery) return -1;
        if (nameB === lowerQuery) return 1;

        // Starts with gets second priority
        if (nameA.startsWith(lowerQuery) && !nameB.startsWith(lowerQuery))
          return -1;
        if (nameB.startsWith(lowerQuery) && !nameA.startsWith(lowerQuery))
          return 1;

        // Contains gets third priority
        if (nameA.includes(lowerQuery) && !nameB.includes(lowerQuery))
          return -1;
        if (nameB.includes(lowerQuery) && !nameA.includes(lowerQuery)) return 1;

        // Alphabetical for ties
        return nameA.localeCompare(nameB);
      });

      // Return all matching players (no limit)
      return players;
    } catch (error) {
      console.error("Error getting player suggestions:", error);
      throw new Error("Failed to get player suggestions");
    }
  }

  /**
   * Updates a player's password
   * @param playerId - ID of the player to update
   * @param newPassword - New password to set
   */
  async updatePlayerPassword(
    playerId: string,
    newPassword: string
  ): Promise<void> {
    try {
      if (!newPassword || newPassword.trim().length === 0) {
        throw new Error("Password cannot be empty");
      }

      const playerRef = doc(db, this.playersCollection, playerId);
      await updateDoc(playerRef, {
        loginPassword: newPassword.trim(),
      });

      // Verify the update by reading the document back
      const updatedDoc = await getDoc(playerRef);
      if (!updatedDoc.exists()) {
        throw new Error("Failed to verify password update");
      }
    } catch (error) {
      console.error("Error updating player password:", error);
      if (
        error instanceof Error &&
        error.message === "Password cannot be empty"
      ) {
        throw error;
      }
      throw new Error("Failed to update player password");
    }
  }

  /**
   * Resets a player's password to a new randomly generated one.
   * @param playerId - ID of the player to reset the password for.
   * @returns The newly generated password.
   */
  async resetPlayerPassword(playerId: string): Promise<string> {
    try {
      const newPassword = Math.random().toString(36).slice(-8); // Generate a random 8-character string
      await this.updatePlayerPassword(playerId, newPassword);
      return newPassword;
    } catch (error) {
      console.error("Error resetting player password:", error);
      throw new Error("Failed to reset player password");
    }
  }

  /**
   * Sets a password for a player (replaces enablePlayerLogin functionality)
   * @param playerId - ID of the player to set password for
   * @param password - Password to set for the player
   */
  async setPlayerPassword(playerId: string, password: string): Promise<void> {
    try {
      if (!password || password.trim().length === 0) {
        throw new Error("Password cannot be empty");
      }

      const playerRef = doc(db, this.playersCollection, playerId);
      await updateDoc(playerRef, {
        loginPassword: password.trim(),
      });
    } catch (error) {
      console.error("Error setting player password:", error);
      if (
        error instanceof Error &&
        error.message === "Password cannot be empty"
      ) {
        throw error;
      }
      throw new Error("Failed to set player password");
    }
  }

  /**
   * Updates the last login timestamp for a player
   * @param playerId - ID of the player to update
   */
  private async updateLastLogin(playerId: string): Promise<void> {
    try {
      const playerRef = doc(db, this.playersCollection, playerId);
      await updateDoc(playerRef, {
        lastLoginAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error updating last login:", error);
      // Don't throw error here as it's not critical for authentication
    }
  }

  /**
   * Gets a player by ID
   * @param playerId - ID of the player to retrieve
   * @returns Player object if found, null otherwise
   */
  async getPlayerById(playerId: string): Promise<Player | null> {
    try {
      const playerRef = doc(db, this.playersCollection, playerId);
      const playerDoc = await getDoc(playerRef);

      if (!playerDoc.exists()) {
        return null;
      }

      return { id: playerDoc.id, ...playerDoc.data() } as Player;
    } catch (error) {
      console.error("Error getting player by ID:", error);
      throw new Error("Failed to get player");
    }
  }

  /**
   * Updates a player's name with 7-day timeout restriction
   * @param playerId - ID of the player to update
   * @param newName - New name to set
   */
  async updatePlayerName(playerId: string, newName: string): Promise<void> {
    try {
      if (!newName || newName.trim().length === 0) {
        throw new Error("Player name cannot be empty");
      }

      // Allow any characters including capital letters and symbols
      // No additional validation for character types

      // Get the current player data to compare names
      const playerRef = doc(db, this.playersCollection, playerId);
      const playerDoc = await getDoc(playerRef);

      if (!playerDoc.exists()) {
        throw new Error("Player not found");
      }

      const originalPlayer = playerDoc.data() as Player;
      const originalName = originalPlayer.name;
      const trimmedNewName = newName.trim();

      // Check if name is actually changing
      if (originalName === trimmedNewName) {
        return; // No change needed
      }

      // Check 7-day timeout for name changes
      // Only apply timeout if they have changed their name before
      if (originalPlayer.lastNameChangeAt) {
        const lastChangeDate = new Date(originalPlayer.lastNameChangeAt);
        const currentDate = new Date();
        const daysSinceLastChange = (currentDate.getTime() - lastChangeDate.getTime()) / (1000 * 60 * 60 * 24);
        
        if (daysSinceLastChange < 7) {
          const remainingDays = Math.ceil(7 - daysSinceLastChange);
          const errorMessage = `Name can only be changed once every 7 days. You can change your name again in ${remainingDays} day${remainingDays !== 1 ? 's' : ''}.`;
          throw new Error(errorMessage);
        }
      }

      // Update the player's name and last change timestamp in the players collection
      await updateDoc(playerRef, {
        name: sanitizeDisplayName(trimmedNewName),
        lastNameChangeAt: new Date().toISOString(),
      });

      // If the name has changed, update all tournament entries
      if (originalName !== trimmedNewName) {
        // Get all tournament entries
        const entriesSnapshot = await getDocs(
          collection(db, "tournamentEntries")
        );
        const updatePromises: Promise<void>[] = [];

        entriesSnapshot.docs.forEach((entryDoc) => {
          const entryData = entryDoc.data();
          let needsUpdate = false;
          const updatedPlayers = [...(entryData.players || [])];
          let updatedTeamName = entryData.teamName;

          // Check and update player names in the players array
          updatedPlayers.forEach((player, index) => {
            if (player.ign === originalName) {
              updatedPlayers[index] = { ...player, ign: trimmedNewName };
              needsUpdate = true;
            }
          });

          // Check and update team name - preserve exact case and symbols
          if (entryData.teamName && entryData.teamName.includes(originalName)) {
            // Replace exact matches of the original name, preserving case and symbols in new name
            updatedTeamName = entryData.teamName.replace(
              new RegExp(escapeRegExp(originalName), "g"),
              trimmedNewName
            );
            if (updatedTeamName !== entryData.teamName) {
              needsUpdate = true;
            }
          }

          // If this entry needs updating, add it to the batch
          if (needsUpdate) {
            const updateData: any = {
              players: updatedPlayers,
            };

            // Only update team name if it changed
            if (updatedTeamName !== entryData.teamName) {
              updateData.teamName = updatedTeamName;
            }

            const updatePromise = updateDoc(
              doc(db, "tournamentEntries", entryDoc.id),
              updateData
            );
            updatePromises.push(updatePromise);
          }
        });

        // Execute all updates
        if (updatePromises.length > 0) {
          await Promise.all(updatePromises);
        }
      }
    } catch (error) {
      console.error("Error updating player name:", error);
      if (
        error instanceof Error &&
        (error.message === "Player name cannot be empty" || 
         error.message.includes("Name can only be changed once every 7 days"))
      ) {
        throw error;
      }
      throw new Error("Failed to update player name");
    }
  }

  /**
   * Link a social provider to a player account
   * @param playerId - ID of the player
   * @param providerId - Social provider ID (e.g., 'google.com', 'facebook.com')
   * @param providerData - Provider data including email, display name, photo URL
   * @returns Updated player data
   */
  async linkSocialProvider(
    playerId: string,
    providerId: string,
    providerData: {
      email?: string;
      displayName?: string;
      photoURL?: string;
      uid?: string;
    }
  ): Promise<Player> {
    try {
      const playerRef = doc(db, this.playersCollection, playerId);
      const playerDoc = await getDoc(playerRef);

      if (!playerDoc.exists()) {
        throw new Error("Player not found");
      }

      const player = playerDoc.data() as Player;
      const currentSocialProviders = player.socialProviders || {};

      // Add or update the social provider
      const updatedProviders = {
        ...currentSocialProviders,
        [providerId]: {
          provider: providerId,
          email: providerData.email,
          displayName: providerData.displayName,
          photoURL: providerData.photoURL,
          uid: providerData.uid,
          linkedAt: new Date().toISOString(),
        },
      };

      await updateDoc(playerRef, {
        socialProviders: updatedProviders,
        socialLoginEnabled: true,
      });

      // Return updated player data
      return {
        ...player,
        socialProviders: updatedProviders,
        socialLoginEnabled: true,
      };
    } catch (error) {
      console.error("Error linking social provider:", error);
      throw new Error("Failed to link social provider");
    }
  }

  /**
   * Unlink a social provider from a player account
   * @param playerId - ID of the player
   * @param providerId - Social provider ID to unlink
   * @returns Updated player data
   */
  async unlinkSocialProvider(playerId: string, providerId: string): Promise<Player> {
    try {
      const playerRef = doc(db, this.playersCollection, playerId);
      const playerDoc = await getDoc(playerRef);

      if (!playerDoc.exists()) {
        throw new Error("Player not found");
      }

      const player = playerDoc.data() as Player;
      const currentSocialProviders = player.socialProviders || {};

      // Remove the provider
      const updatedProviders = { ...currentSocialProviders };
      delete updatedProviders[providerId];

      // Check if any social providers remain
      const hasSocialProviders = Object.keys(updatedProviders).length > 0;

      await updateDoc(playerRef, {
        socialProviders: updatedProviders,
        socialLoginEnabled: hasSocialProviders,
      });

      // Return updated player data
      return {
        ...player,
        socialProviders: updatedProviders,
        socialLoginEnabled: hasSocialProviders,
      };
    } catch (error) {
      console.error("Error unlinking social provider:", error);
      throw new Error("Failed to unlink social provider");
    }
  }

  /**
   * Authenticate a player using social provider
   * @param providerId - Social provider ID (e.g., 'google.com')
   * @param providerUid - Firebase Auth UID from the social provider
   * @param email - Email from the social provider (optional)
   * @returns Player object if authenticated, null otherwise
   */
  async authenticatePlayerWithSocialProvider(
    providerId: string,
    providerUid: string,
    email?: string
  ): Promise<Player | null> {
    try {
      const playersRef = collection(db, this.playersCollection);
      const querySnapshot = await getDocs(playersRef);

      for (const docSnap of querySnapshot.docs) {
        const playerData = { id: docSnap.id, ...docSnap.data() } as Player;

        // Skip deleted or banned players
        if (playerData.deleted || playerData.isBanned) {
          continue;
        }

        // Check if player has social providers enabled
        if (!playerData.socialLoginEnabled || !playerData.socialProviders) {
          continue;
        }

        // Check if the provider exists and matches
        const socialProvider = playerData.socialProviders[providerId];
        if (socialProvider && socialProvider.uid === providerUid) {
          // Additional email verification if provided
          if (email && socialProvider.email && socialProvider.email !== email) {
            continue;
          }

          await this.updateLastLogin(playerData.id);
          return playerData;
        }
      }

      return null;
    } catch (error) {
      console.error("Error authenticating player with social provider:", error);
      throw new Error("Failed to authenticate player with social provider");
    }
  }

  /**
   * Find players by social provider email
   * @param email - Email address from social provider
   * @returns Array of players with matching social provider email
   */
  async findPlayersBySocialEmail(email: string): Promise<Player[]> {
    try {
      const playersRef = collection(db, this.playersCollection);
      const querySnapshot = await getDocs(playersRef);
      const matchingPlayers: Player[] = [];

      querySnapshot.forEach((docSnap) => {
        const playerData = { id: docSnap.id, ...docSnap.data() } as Player;

        // Skip deleted players
        if (playerData.deleted) {
          return;
        }

        // Check if any social provider has this email
        if (playerData.socialProviders) {
          Object.values(playerData.socialProviders).forEach((provider) => {
            if (provider.email === email) {
              matchingPlayers.push(playerData);
            }
          });
        }
      });

      return matchingPlayers;
    } catch (error) {
      console.error("Error finding players by social email:", error);
      throw new Error("Failed to find players by social email");
    }
  }
}

// Export a singleton instance
export const playerAuthService = new PlayerAuthService();
