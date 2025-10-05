"use client";
import { useState, useEffect, useCallback } from "react";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Player } from "@/lib/types";
import { PlayerWithStats } from "../types";
import { calculateKD } from "@/lib/utils";
import { toast } from "sonner";

export function usePlayerData(selectedSeason: string) {
  const [players, setPlayers] = useState<PlayerWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchPlayersWithStats = useCallback(async () => {
    setIsLoading(true);
    try {
      const [playersSnapshot, entriesSnapshot] = await Promise.all([
        getDocs(collection(db, "players")),
        getDocs(collection(db, "tournamentEntries")),
      ]);

      const statsMap = new Map<
        string,
        { matchesPlayed: number; totalKills: number }
      >();

      // Filter entries by season if selected
      const filteredEntries =
        selectedSeason === "all"
          ? entriesSnapshot.docs
          : entriesSnapshot.docs.filter(
              (doc) => doc.data().seasonId === selectedSeason
            );

      filteredEntries.forEach((doc) => {
        const entry = doc.data();
        if (entry.players && entry.matchScores) {
          entry.players.forEach((player: any, playerIndex: number) => {
            const playerName = player.ign;
            if (!statsMap.has(playerName)) {
              statsMap.set(playerName, { matchesPlayed: 0, totalKills: 0 });
            }
            const stats = statsMap.get(playerName)!;

            Object.values(entry.matchScores).forEach((score: any) => {
              if (
                score.playerKills &&
                score.playerKills[playerIndex] !== undefined
              ) {
                stats.totalKills += score.playerKills[playerIndex] || 0;
                stats.matchesPlayed++;
              }
            });
          });
        }
      });

      const playersWithStats: PlayerWithStats[] = playersSnapshot.docs
        .filter((doc) => !doc.data().deleted) // Filter out deleted players
        .map((doc) => {
          const playerData = { id: doc.id, ...doc.data() } as Player;
          const stats = statsMap.get(playerData.name) || {
            matchesPlayed: 0,
            totalKills: 0,
          };

          return {
            ...playerData,
            matchesPlayed: stats.matchesPlayed,
            totalKills: stats.totalKills,
            overallKD: calculateKD(stats.totalKills, stats.matchesPlayed),
            avgKillsPerMatch:
              stats.matchesPlayed > 0
                ? parseFloat(
                    (stats.totalKills / stats.matchesPlayed).toFixed(1)
                  )
                : 0,
          };
        });

      setPlayers(playersWithStats);
    } catch (error) {
      console.error("Error fetching players:", error);
      toast.error("Failed to load players.");
    } finally {
      setIsLoading(false);
    }
  }, [selectedSeason]);

  const addPlayer = useCallback(
    async (newPlayer: Player) => {
      if (!newPlayer.name.trim()) {
        toast.error("Player name is required");
        return false;
      }

      const playerId = `${newPlayer.category
        .toLowerCase()
        .replace(" ", "_")}_${newPlayer.name
        .replace(/\s+/g, "_")
        .toLowerCase()}_${Date.now()}`;

      try {
        await setDoc(doc(db, "players", playerId), {
          name: newPlayer.name,
          category: newPlayer.category,
          phoneNumber: null,
          balance: newPlayer.balance,
          createdAt: new Date().toISOString(),
          ...(newPlayer.loginPassword && {
            loginPassword: newPlayer.loginPassword.trim(),
          }),
        });

        toast.success("Player added successfully");
        await fetchPlayersWithStats();
        return true;
      } catch (error) {
        console.error("Error adding player:", error);
        toast.error("Failed to add player");
        return false;
      }
    },
    [fetchPlayersWithStats]
  );

  const updatePlayer = useCallback(
    async (editingPlayer: Player) => {
      if (!editingPlayer.name.trim()) {
        toast.error("Player name is required");
        return false;
      }

      try {
        // Get the original player data to compare names
        const originalPlayer = players.find((p) => p.id === editingPlayer.id);
        const originalName = originalPlayer?.name;
        const newName = editingPlayer.name.trim();

        const updatedData = {
          name: newName,
          category: editingPlayer.category,
          phoneNumber: null,
          balance: Number(editingPlayer.balance) || 0,
        };

        // Update player in players collection
        await setDoc(doc(db, "players", editingPlayer.id), updatedData, {
          merge: true,
        });

        // If name changed, update all tournament entries that contain this player
        if (originalName && originalName !== newName) {
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
                updatedPlayers[index] = { ...player, ign: newName };
                needsUpdate = true;
              }
            });

            // Check and update team name with intelligent replacement
            if (
              entryData.teamName &&
              entryData.teamName.includes(originalName)
            ) {
              // Create a more intelligent replacement that considers word boundaries and common separators
              const teamNameParts = entryData.teamName.split(/([_\-\s]+)/); // Split on separators but keep them
              let hasReplacement = false;

              const updatedParts = teamNameParts.map((part: string) => {
                // Only replace if the part exactly matches the original name (case-insensitive for flexibility)
                if (part.toLowerCase() === originalName.toLowerCase()) {
                  hasReplacement = true;
                  return newName;
                }
                return part;
              });

              if (hasReplacement) {
                updatedTeamName = updatedParts.join("");
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
            toast.success(
              `Player updated successfully! Updated ${updatePromises.length} team entries.`
            );
          } else {
            toast.success("Player updated successfully");
          }
        } else {
          toast.success("Player updated successfully");
        }

        await fetchPlayersWithStats();
        return true;
      } catch (error) {
        console.error("Error updating player:", error);
        toast.error("Failed to update player");
        return false;
      }
    },
    [players, fetchPlayersWithStats]
  );

  useEffect(() => {
    fetchPlayersWithStats();
  }, [fetchPlayersWithStats]);

  const deletePlayer = useCallback(
    async (playerId: string) => {
      try {
        // First, check if player is referenced in any tournament entries
        const entriesSnapshot = await getDocs(
          collection(db, "tournamentEntries")
        );
        const playerName = players.find((p) => p.id === playerId)?.name;

        if (playerName) {
          const hasReferences = entriesSnapshot.docs.some((doc) => {
            const entry = doc.data();
            return entry.players?.some((p: any) => p.ign === playerName);
          });

          if (hasReferences) {
            toast.error(
              "Cannot delete player: Player is referenced in tournament entries. Consider banning instead."
            );
            return false;
          }
        }

        // Delete from Firestore
        await updateDoc(doc(db, "players", playerId), {
          deleted: true,
          deletedAt: new Date().toISOString(),
        });

        toast.success("Player deleted successfully");
        await fetchPlayersWithStats();
        return true;
      } catch (error) {
        console.error("Error deleting player:", error);
        toast.error("Failed to delete player");
        return false;
      }
    },
    [players, fetchPlayersWithStats]
  );

  const banPlayer = useCallback(
    async (
      playerId: string,
      banData: { reason: string; duration: number; bannedBy: string }
    ) => {
      try {
        // First update the player's ban status
        await updateDoc(doc(db, "players", playerId), {
          isBanned: true,
          banReason: banData.reason,
          banDuration: banData.duration,
          bannedAt: new Date().toISOString(),
          bannedBy: banData.bannedBy,
        });

        // Get the player's name to find their votes
        const playerDoc = await getDocs(collection(db, "players"));
        const playerData = playerDoc.docs.find(doc => doc.id === playerId)?.data();
        
        if (playerData) {
          // Import the poll service
          const { pollService } = await import("@/lib/pollService");
          
          try {
            // Remove all votes for this player
            await pollService.removeAllVotesForPlayer(playerId);
            console.log(`Removed all votes for banned player: ${playerData.name}`);
          } catch (error) {
            console.error("Error removing player's votes:", error);
            // Don't fail the ban operation if vote removal fails
            toast.warning("Player banned, but there was an issue removing their votes");
          }
        }

        toast.success("Player banned successfully");
        await fetchPlayersWithStats();
        return true;
      } catch (error) {
        console.error("Error banning player:", error);
        toast.error("Failed to ban player");
        return false;
      }
    },
    [fetchPlayersWithStats]
  );

  const unbanPlayer = useCallback(
    async (playerId: string) => {
      try {
        await updateDoc(doc(db, "players", playerId), {
          isBanned: false,
          banReason: null,
          banDuration: null,
          bannedAt: null,
          bannedBy: null,
        });

        toast.success("Player unbanned successfully");
        await fetchPlayersWithStats();
        return true;
      } catch (error) {
        console.error("Error unbanning player:", error);
        toast.error("Failed to unban player");
        return false;
      }
    },
    [fetchPlayersWithStats]
  );

  return {
    players,
    isLoading,
    refetch: fetchPlayersWithStats,
    addPlayer,
    updatePlayer,
    deletePlayer,
    banPlayer,
    unbanPlayer,
  };
}
