import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  doc,
  writeBatch,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  setDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { Player, TournamentConfig, PlayerTransaction } from "@/lib/types";
import { FaEdit, FaCheck } from "react-icons/fa";

// Using crypto.randomUUID() instead of uuid package for better compatibility
function generateUUID(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback UUID generation
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

interface TeamWithExclusions {
  teamName: string;
  players: { ign: string; kills: number; id?: string }[];
  excludedFromDeduction?: string[];
}

interface TeamConfirmationModalProps {
  showConfirmModal: boolean;
  setShowConfirmModal: (show: boolean) => void;
  selectedTournament: string | null;
  teamsToCreate: TeamWithExclusions[];
  setTeamsToCreate: (
    teams:
      | TeamWithExclusions[]
      | ((prev: TeamWithExclusions[]) => TeamWithExclusions[])
  ) => void;
}

// Fisher-Yates shuffle function to randomize the teams array
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function TeamConfirmationModal({
  showConfirmModal,
  setShowConfirmModal,
  selectedTournament,
  teamsToCreate,
  setTeamsToCreate,
}: TeamConfirmationModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [editingTeamUuid, setEditingTeamUuid] = useState<string | null>(null);
  const [shuffledTeams, setShuffledTeams] = useState<
    (TeamWithExclusions & { uuid: string })[]
  >([]);

  useEffect(() => {
    if (showConfirmModal) {
      // Always update shuffledTeams when teamsToCreate changes
      const newShuffled = shuffleArray(teamsToCreate).map((team) => ({
        ...team,
        uuid: generateUUID(),
      }));
      setShuffledTeams(newShuffled);
      setEditingTeamUuid(null);
    }
  }, [showConfirmModal, teamsToCreate]); // Run when modal opens OR when teamsToCreate changes

  // Helper to update both states in sync
  const updateTeamAndPlayers = (
    uuid: string,
    playerIdx: number,
    newIGN: string,
    newPlayers?: { ign: string; kills: number; id?: string }[]
  ) => {
    setShuffledTeams((current: (TeamWithExclusions & { uuid: string })[]) =>
      current.map((team: TeamWithExclusions & { uuid: string }) => {
        if (team.uuid === uuid) {
          const updatedPlayers = newPlayers
            ? newPlayers
            : team.players.map(
                (p: { ign: string; kills: number; id?: string }, idx: number) =>
                  idx === playerIdx ? { ...p, ign: newIGN } : p
              );
          const autoTeamName = updatedPlayers
            .map((p: { ign: string }) => p.ign)
            .filter((ign: string) => ign.trim() !== "")
            .join("_");
          return { ...team, players: updatedPlayers, teamName: autoTeamName };
        }
        return team;
      })
    );
    setTeamsToCreate((current: TeamWithExclusions[]) =>
      current.map((team: TeamWithExclusions) => {
        const st = shuffledTeams.find(
          (t: TeamWithExclusions & { uuid: string }) => t.uuid === uuid
        );
        const match =
          st &&
          team.players.every((p: { ign: string; id?: string }, idx: number) => {
            if (!st) return false;
            return (
              (p.id && st.players[idx]?.id && p.id === st.players[idx].id) ||
              p.ign === st.players[idx]?.ign
            );
          });
        if (match) {
          const updatedPlayers = newPlayers
            ? newPlayers
            : team.players.map(
                (p: { ign: string; kills: number; id?: string }, idx: number) =>
                  idx === playerIdx ? { ...p, ign: newIGN } : p
              );
          const autoTeamName = updatedPlayers
            .map((p: { ign: string }) => p.ign)
            .filter((ign: string) => ign.trim() !== "")
            .join("_");
          return { ...team, players: updatedPlayers, teamName: autoTeamName };
        }
        return team;
      })
    );
  };

  const handleConfirm = async () => {
    if (!selectedTournament) return;
    setIsLoading(true);
    try {
      // Get tournament entry fee and title
      const tournamentDoc = await getDoc(
        doc(db, "tournaments", selectedTournament)
      );
      const tournamentData = tournamentDoc.exists()
        ? tournamentDoc.data()
        : null;
      const entryFee = tournamentData?.entryFee
        ? Number(tournamentData.entryFee)
        : 20;
      const tournamentTitle = tournamentData?.title || selectedTournament;
      const seasonId = tournamentData?.seasonId || null;

      // Fetch all players (for balance deduction), exclude soft-deleted
      const playersSnapshot = await getDocs(collection(db, "players"));
      const playerMapById = new Map<string, Player & { id: string }>();
      const playerMapByName = new Map<string, Player & { id: string }>();
      playersSnapshot.forEach((docSnap) => {
        const data = { ...(docSnap.data() as Player), id: docSnap.id };
        if (!(data as any).deleted) {
          playerMapById.set(docSnap.id, data);
          if (data.name) playerMapByName.set(data.name, data);
        }
      });

      // Filter out teams where all IGNs are empty
      const validTeams = teamsToCreate.filter((team) =>
        team.players.some((player) => player.ign && player.ign.trim() !== "")
      );

      const batch = writeBatch(db);
      const now = new Date().toISOString();
      for (const team of validTeams) {
        const phoneNumber = `+91${Math.floor(
          1000000000 + Math.random() * 9000000000
        )}`;
        const docRef = doc(db, "tournamentEntries", phoneNumber);

        // Ensure all referenced players exist in players collection
        for (const playerObj of team.players) {
          const ign = (playerObj.ign || "").trim();
          if (!ign) continue;
          let existing = playerMapByName.get(ign);
          if (!existing) {
            // Create a minimal player document so that players pages can reflect stats
            const newPlayerRef = doc(collection(db, "players"));
            const newPlayerDoc: Partial<Player> & { createdAt: string } = {
              name: ign,
              category: "Uncategorized" as any,
              phoneNumber: null as any,
              balance: 0 as any,
              createdAt: now,
            };
            batch.set(newPlayerRef, newPlayerDoc as any);
            const created: Player & { id: string } = {
              ...(newPlayerDoc as Player),
              id: newPlayerRef.id,
            };
            playerMapById.set(newPlayerRef.id, created);
            playerMapByName.set(ign, created);
          }
        }

        // Determine team mode based on actual team size
        const teamSize = team.players.length;
        let teamMode: string;
        if (teamSize === 1) {
          teamMode = "Solo 1";
        } else if (teamSize === 2) {
          teamMode = "Duo 2+1";
        } else if (teamSize === 3) {
          teamMode = "Trio 3+1";
        } else if (teamSize === 4) {
          teamMode = "Squad 4+1";
        } else {
          teamMode = `Team ${teamSize}`;
        }

        batch.set(docRef, {
          phoneNumber,
          teamName: team.teamName,
          players: team.players,
          matchScores: {},
          submittedAt: now,
          teamMode: teamMode,
          tournamentId: selectedTournament,
          ...(seasonId ? { seasonId } : {}),
        });
        // Deduct entry fee from each player in the team, unless excluded
        for (const playerObj of team.players) {
          const ign = (playerObj.ign || "").trim();
          if (!ign) continue;
          const player = playerMapByName.get(ign);
          const excludedIds = team.excludedFromDeduction || [];
          if (player && !excludedIds.includes(player.id)) {
            const currentBalance =
              typeof (player as any).balance === "number"
                ? (player as any).balance
                : 0;
            const newBalance = currentBalance - entryFee;
            batch.update(doc(db, "players", player.id), {
              balance: newBalance,
            });
            // Log transaction
            const txId = `${player.id}_${now}`;
            batch.set(doc(db, `players/${player.id}/transactions`, txId), {
              id: txId,
              playerId: player.id,
              amount: -entryFee,
              type: "deduct",
              reason: `Tournament Entry Fee (${tournamentTitle})`,
              createdAt: now,
              tournamentId: selectedTournament,
            });
          }
        }
      }
      await batch.commit();
      toast.success(`${validTeams.length} teams created and balances updated!`);
      setShowConfirmModal(false);
      setTeamsToCreate([]);
    } catch (error) {
      console.error("Error creating teams or updating balances:", error);
      toast.error("Failed to create teams or update balances.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] p-6 rounded-2xl shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Confirm Teams: {teamsToCreate.length}
          </DialogTitle>
          <DialogDescription className="text-gray-500">
            Review and confirm the teams before proceeding.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] border rounded-lg p-2 sm:p-4">
          {shuffledTeams.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 overflow-x-auto">
              {shuffledTeams.map((team, index) => {
                const isEditing = editingTeamUuid === team.uuid;
                const teamDisplayName = team.players
                  .map((p: { ign: string }) => p.ign)
                  .join("_");
                return (
                  <div
                    key={team.uuid}
                    className="p-3 sm:p-4 bg-gray-100 dark:bg-gray-800 rounded-lg shadow-sm w-64 sm:w-72 max-w-full flex flex-col items-stretch border border-gray-200 dark:border-gray-700"
                    style={{ boxSizing: "border-box" }}
                  >
                    {!isEditing ? (
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-800 dark:text-gray-100 text-base sm:text-lg truncate w-full">
                          {teamDisplayName}
                        </span>
                        <button
                          onClick={() => setEditingTeamUuid(team.uuid)}
                          className="ml-2 px-2 py-1 text-xs bg-blue-500 dark:bg-blue-600 text-white rounded hover:bg-blue-600 dark:hover:bg-blue-700 transition flex items-center"
                          title="Edit"
                        >
                          <FaEdit />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-800 dark:text-gray-100 text-base sm:text-lg truncate w-full">
                            {teamDisplayName}
                          </span>
                          <button
                            onClick={() => setEditingTeamUuid(null)}
                            className="ml-2 px-2 py-1 text-xs bg-green-500 dark:bg-green-600 text-white rounded hover:bg-green-600 dark:hover:bg-green-700 transition flex items-center"
                            title="Done"
                          >
                            <FaCheck />
                          </button>
                        </div>
                        <ul className="mt-2 text-gray-600 dark:text-gray-300 text-sm">
                          {(() => {
                            // Add an extra empty input if the last player's IGN is not empty
                            const displayPlayers = [...team.players];
                            if (
                              displayPlayers.length === 0 ||
                              displayPlayers[
                                displayPlayers.length - 1
                              ].ign.trim() !== ""
                            ) {
                              displayPlayers.push({ ign: "", kills: 0 });
                            }
                            return displayPlayers.map(
                              (
                                player: {
                                  ign: string;
                                  kills: number;
                                  id?: string;
                                },
                                idx: number
                              ) => (
                                <li
                                  key={player.id || idx}
                                  className="flex items-center gap-2 mb-2"
                                >
                                  <input
                                    type="text"
                                    value={player.ign}
                                    onChange={(
                                      e: React.ChangeEvent<HTMLInputElement>
                                    ) => {
                                      const value = e.target.value;
                                      // Add new player if editing the extra input
                                      if (idx === team.players.length) {
                                        // Only add if not empty
                                        if (value.trim() !== "") {
                                          const newPlayers = [
                                            ...team.players,
                                            { ign: value, kills: 0 },
                                          ];
                                          updateTeamAndPlayers(
                                            team.uuid,
                                            idx,
                                            value,
                                            newPlayers
                                          );
                                        }
                                      } else {
                                        // Edit existing player
                                        updateTeamAndPlayers(
                                          team.uuid,
                                          idx,
                                          value
                                        );
                                      }
                                    }}
                                    className="border rounded px-2 py-1 w-full min-w-0 h-8 bg-white dark:bg-gray-900 text-xs sm:text-sm truncate text-gray-800 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                                    placeholder="IGN"
                                  />
                                  {team.excludedFromDeduction?.includes(
                                    player.id || ""
                                  ) && (
                                    <span className="ml-2 text-xs text-red-500">
                                      Excluded
                                    </span>
                                  )}
                                </li>
                              )
                            );
                          })()}
                        </ul>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-center">No teams to create.</p>
          )}
        </ScrollArea>
        <DialogFooter className="mt- flex justify-between items-center gap-2 flex-wrap">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowConfirmModal(false)}
              disabled={isLoading}
              className="min-w-[80px] px-4 py-2"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={isLoading}
              className="min-w-[80px] px-4 py-2"
            >
              {isLoading ? "Creating..." : "Confirm"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
