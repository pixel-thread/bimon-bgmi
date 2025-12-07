import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { ScrollArea } from "@/src/components/ui/scroll-area";
import { FaEdit, FaCheck } from "react-icons/fa";
import { useTournamentStore } from "../store/tournament";

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
  teamsToCreate: TeamWithExclusions[];
  setTeamsToCreate: (
    teams:
      | TeamWithExclusions[]
      | ((prev: TeamWithExclusions[]) => TeamWithExclusions[]),
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
  teamsToCreate,
  setTeamsToCreate,
}: TeamConfirmationModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { tournamentId: selectedTournament } = useTournamentStore();
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
    newPlayers?: { ign: string; kills: number; id?: string }[],
  ) => {
    setShuffledTeams((current: (TeamWithExclusions & { uuid: string })[]) =>
      current.map((team: TeamWithExclusions & { uuid: string }) => {
        if (team.uuid === uuid) {
          const updatedPlayers = newPlayers
            ? newPlayers
            : team.players.map(
                (
                  p: { ign: string; kills: number; id?: string },
                  idx: number,
                ) => (idx === playerIdx ? { ...p, ign: newIGN } : p),
              );
          const autoTeamName = updatedPlayers
            .map((p: { ign: string }) => p.ign)
            .filter((ign: string) => ign.trim() !== "")
            .join("_");
          return { ...team, players: updatedPlayers, teamName: autoTeamName };
        }
        return team;
      }),
    );
    setTeamsToCreate((current: TeamWithExclusions[]) =>
      current.map((team: TeamWithExclusions) => {
        const st = shuffledTeams.find(
          (t: TeamWithExclusions & { uuid: string }) => t.uuid === uuid,
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
                (
                  p: { ign: string; kills: number; id?: string },
                  idx: number,
                ) => (idx === playerIdx ? { ...p, ign: newIGN } : p),
              );
          const autoTeamName = updatedPlayers
            .map((p: { ign: string }) => p.ign)
            .filter((ign: string) => ign.trim() !== "")
            .join("_");
          return { ...team, players: updatedPlayers, teamName: autoTeamName };
        }
        return team;
      }),
    );
  };

  const handleConfirm = async () => {
    if (!selectedTournament) return;
    setIsLoading(true);
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
                                idx: number,
                              ) => (
                                <li
                                  key={player.id || idx}
                                  className="flex items-center gap-2 mb-2"
                                >
                                  <input
                                    type="text"
                                    value={player.ign}
                                    onChange={(
                                      e: React.ChangeEvent<HTMLInputElement>,
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
                                            newPlayers,
                                          );
                                        }
                                      } else {
                                        // Edit existing player
                                        updateTeamAndPlayers(
                                          team.uuid,
                                          idx,
                                          value,
                                        );
                                      }
                                    }}
                                    className="border rounded px-2 py-1 w-full min-w-0 h-8 bg-white dark:bg-gray-900 text-xs sm:text-sm truncate text-gray-800 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                                    placeholder="IGN"
                                  />
                                  {team.excludedFromDeduction?.includes(
                                    player.id || "",
                                  ) && (
                                    <span className="ml-2 text-xs text-red-500">
                                      Excluded
                                    </span>
                                  )}
                                </li>
                              ),
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
