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
import { LoadingButton } from "@/src/components/ui/loading-button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Card } from "@/src/components/ui/card";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/src/lib/firebase";
import { Player } from "@/src/lib/types";
import { sanitizeDisplayName } from "@/src/lib/unicodeSanitizer";
import { toast } from "sonner";

interface AddTeamModalProps {
  onClose: () => void;
  onSave: (teamData: { teamName: string; players: string[] }) => Promise<void>;
  isSaving: boolean;
}

export default function AddTeamModal({
  onClose,
  onSave,
  isSaving,
}: AddTeamModalProps) {
  const [players, setPlayers] = useState(["", "", "", ""]); // Default to 4 player slots
  const [registeredPlayers, setRegisteredPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState<{ [key: number]: Player[] }>(
    {}
  );

  // Fetch registered players on component mount
  useEffect(() => {
    const fetchRegisteredPlayers = async () => {
      try {
        const playersCollection = collection(db, "players");
        const playersSnapshot = await getDocs(playersCollection);
        const playersList: Player[] = [];

        playersSnapshot.forEach((doc) => {
          const playerData = { id: doc.id, ...doc.data() } as Player;
          if (!playerData.deleted) {
            playersList.push(playerData);
          }
        });

        setRegisteredPlayers(playersList);
      } catch (error) {
        console.error("Error fetching players:", error);
        toast.error("Failed to load registered players");
      } finally {
        setLoading(false);
      }
    };

    fetchRegisteredPlayers();
  }, []);

  // Generate team name based on selected players
  const generateTeamName = (playerNames: string[]) => {
    const validPlayers = playerNames.filter((name) => name.trim() !== "");
    if (validPlayers.length === 0) return "";

    if (validPlayers.length === 1) {
      return validPlayers[0];
    } else if (validPlayers.length === 2) {
      return `${validPlayers[0]}_${validPlayers[1]}`;
    } else {
      return `${validPlayers[0]}_squad`;
    }
  };

  // Filter suggestions based on input
  const getSuggestions = (input: string, playerIndex: number) => {
    if (!input.trim()) return [];

    const normInput = input.normalize("NFC").toLowerCase();

    const filtered = registeredPlayers.filter((player) => {
      const normName = player.name.normalize("NFC").toLowerCase();
      return (
        normName.includes(normInput) &&
        !players.some((p, idx) => idx !== playerIndex && p === player.name)
      );
    });

    return filtered.slice(0, 5); // Limit to 5 suggestions
  };

  const handlePlayerChange = (index: number, value: string) => {
    const newPlayers = [...players];
    newPlayers[index] = sanitizeDisplayName(value);
    setPlayers(newPlayers);

    // Update suggestions for this input
    if (value.trim()) {
      const newSuggestions = getSuggestions(value, index);
      setSuggestions((prev) => ({ ...prev, [index]: newSuggestions }));
    } else {
      setSuggestions((prev) => {
        const updated = { ...prev };
        delete updated[index];
        return updated;
      });
    }
  };

  const selectSuggestion = (index: number, playerName: string) => {
    const newPlayers = [...players];
    newPlayers[index] = sanitizeDisplayName(playerName);
    setPlayers(newPlayers);

    // Clear suggestions for this input
    setSuggestions((prev) => {
      const updated = { ...prev };
      delete updated[index];
      return updated;
    });
  };

  const handleSave = async () => {
    const filteredPlayers = players.filter((p) => p.trim() !== "");
    if (filteredPlayers.length === 0) {
      toast.error("Please add at least one player.");
      return;
    }

    const teamName = generateTeamName(filteredPlayers);

    await onSave({ teamName, players: filteredPlayers });
  };

  const teamName = generateTeamName(players);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-lg md:max-w-lg lg:max-w-lg xl:max-w-lg 2xl:max-w-lg p-4 bg-white dark:bg-black rounded-xl border-none shadow-xl text-foreground">
        <DialogHeader className="mb-3">
          <DialogTitle className="text-lg font-bold text-gray-900 dark:text-foreground">
            Add New Team
          </DialogTitle>
          <DialogDescription className="text-xs text-gray-500 dark:text-muted-foreground">
            Add players to create a team. Team name will be generated
            automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {/* Team Preview */}
          {teamName && (
            <Card className="p-3 shadow-sm border-none bg-blue-50 dark:bg-blue-900/20 text-foreground">
              <h3 className="text-sm font-semibold mb-1">Team Preview</h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {teamName}
              </p>
            </Card>
          )}

          {/* Players */}
          <Card className="p-3 shadow-sm border-none bg-background dark:bg-neutral-900 text-foreground">
            <h3 className="text-sm font-semibold mb-2">Players</h3>
            <div className="space-y-3">
              {players.map((player, index) => (
                <div key={index} className="relative">
                  <div className="flex items-center gap-2">
                    <Label className="text-xs min-w-[80px]">
                      Player {index + 1}
                    </Label>
                    <div className="flex-1 relative">
                      <Input
                        type="text"
                        value={player}
                        onChange={(e) =>
                          handlePlayerChange(index, e.target.value)
                        }
                        placeholder="Start typing player name..."
                        className="text-sm bg-white dark:bg-black text-foreground"
                        disabled={loading}
                      />

                      {/* Suggestions dropdown */}
                      {suggestions[index] && suggestions[index].length > 0 && (
                        <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-40 overflow-y-auto">
                          {suggestions[index].map((suggestedPlayer) => (
                            <button
                              key={suggestedPlayer.id}
                              type="button"
                              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between"
                              onClick={() =>
                                selectSuggestion(index, suggestedPlayer.name)
                              }
                            >
                              <span>{suggestedPlayer.name}</span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {suggestedPlayer.category}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {loading && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Loading registered players...
              </p>
            )}
          </Card>
        </div>

        <DialogFooter className="flex flex-row justify-end gap-2 mt-4">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
            className="text-sm px-3 py-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || loading}
            className="bg-blue-600 dark:bg-blue-700 text-white hover:bg-blue-700 dark:hover:bg-blue-800 text-sm px-3 py-1"
          >
            {isSaving ? "Saving..." : "Add Team"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
