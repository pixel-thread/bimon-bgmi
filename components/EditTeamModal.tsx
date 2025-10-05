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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CombinedTeamData, Player } from "@/lib/types";
import { Card } from "@/components/ui/card";
import TeamScoreInputs from "./TeamScoreInputs";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";

interface EditTeamModalProps {
  team: CombinedTeamData;
  playerKills: string[];
  setPlayerKills: (kills: string[]) => void;
  playerParticipation: boolean[];
  setPlayerParticipation: (participation: boolean[]) => void;
  placementInput: string;
  setPlacementInput: (val: string) => void;
  player1Ign: string;
  setPlayer1Ign: (name: string) => void;
  player2Ign: string;
  setPlayer2Ign: (name: string) => void;
  teamName: string;
  kills: string;
  setKills: (kills: string) => void;
  onClose: () => void;
  onSave: () => Promise<void>;
  allTeams: CombinedTeamData[];
}

export default function EditTeamModal({
  team,
  playerKills,
  setPlayerKills,
  playerParticipation,
  setPlayerParticipation,
  placementInput,
  setPlacementInput,
  player1Ign,
  setPlayer1Ign,
  player2Ign,
  setPlayer2Ign,
  kills,
  teamName,
  setKills,
  onClose,
  onSave,
  allTeams,
}: EditTeamModalProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [playerSuggestions, setPlayerSuggestions] = useState<string[]>([]);

  // Fetch all players when modal opens
  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const playersSnapshot = await getDocs(collection(db, "players"));
        const playersData = playersSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() })) as Player[];
        const activePlayers = playersData.filter(p => !p.deleted);
        setPlayerSuggestions(activePlayers.map(p => p.name));
      } catch (error) {
        console.error("Error fetching players:", error);
        toast.error("Failed to load player suggestions");
      }
    };

    fetchPlayers();
  }, []);

  // Validate player names against existing players
  const validatePlayerName = (playerName: string): boolean => {
    if (!playerName.trim()) return true; // Empty is allowed for player 2
    return playerSuggestions.includes(playerName.trim());
  };

  // Filter suggestions based on input length and matching
  const getFilteredSuggestions = (inputValue: string): string[] => {
    if (inputValue.length < 2) return [];
    return playerSuggestions.filter(suggestion => 
      suggestion.toLowerCase().includes(inputValue.toLowerCase())
    );
  };

  const canSave = (): boolean => {
    // Player 1 is required and must be valid
    if (!player1Ign.trim() || !validatePlayerName(player1Ign)) {
      return false;
    }
    // Player 2 is optional, but if provided, must be valid
    if (player2Ign.trim() && !validatePlayerName(player2Ign)) {
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!canSave()) {
      toast.error("Please ensure all player names match existing players");
      return;
    }
    
    setIsSaving(true);
    try {
      await onSave();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-md md:max-w-sm lg:max-w-sm xl:max-w-xs 2xl:max-w-xs p-4 bg-white dark:bg-black rounded-xl border-none shadow-xl text-foreground">
        <DialogHeader className="mb-3">
          <DialogTitle className="text-lg font-bold text-gray-900 dark:text-foreground">
            Edit Team: {team.teamName}
          </DialogTitle>
          <DialogDescription className="text-xs text-gray-500 dark:text-muted-foreground">
            Update team details and scores
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Card className="p-3 shadow-sm border-none bg-background dark:bg-neutral-900 text-foreground">
            <h3 className="text-sm font-semibold mb-2">Team Information</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="player1-ign" className="text-xs min-w-[80px]">Player 1 IGN</Label>
                <Input
                  id="player1-ign"
                  value={player1Ign}
                  onChange={(e) => setPlayer1Ign(e.target.value)}
                  className="flex-1 text-sm bg-white dark:bg-black text-foreground"
                  placeholder="Player 1 In-Game Name"
                  list="player1-suggestions"
                  onFocus={e => setTimeout(() => (e.target as HTMLInputElement).select(), 10)}
                  onClick={e => setTimeout(() => (e.target as HTMLInputElement).select(), 10)}
                  required
                />
                <datalist id="player1-suggestions">
                  {getFilteredSuggestions(player1Ign).map((suggestion, i) => (
                    <option key={i} value={suggestion} />
                  ))}
                </datalist>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="player2-ign" className="text-xs min-w-[80px]">Player 2 IGN</Label>
                <Input
                  id="player2-ign"
                  value={player2Ign}
                  onChange={(e) => setPlayer2Ign(e.target.value)}
                  className="flex-1 text-sm bg-white dark:bg-black text-foreground"
                  placeholder="Player 2 In-Game Name (optional)"
                  list="player2-suggestions"
                  onFocus={e => setTimeout(() => (e.target as HTMLInputElement).select(), 10)}
                  onClick={e => setTimeout(() => (e.target as HTMLInputElement).select(), 10)}
                />
                <datalist id="player2-suggestions">
                  {getFilteredSuggestions(player2Ign).map((suggestion, i) => (
                    <option key={i} value={suggestion} />
                  ))}
                </datalist>
              </div>
            </div>
          </Card>

          <Card className="p-3 shadow-sm border-none bg-background dark:bg-neutral-900 text-foreground">
            <h3 className="text-sm font-semibold mb-2">Match Performance</h3>
            <TeamScoreInputs
              teamName={team.teamName}
              placement={placementInput === "0" ? "" : placementInput}
              kills={kills === "0" ? "" : kills}
              onPlacementChange={setPlacementInput}
              onKillsChange={setKills}
              showPlayerKills={true}
              showPlayerParticipation={true}
              players={team.players}
              playerKills={playerKills}
              playerParticipation={playerParticipation}
              onPlayerKillsChange={setPlayerKills}
              onPlayerParticipationChange={setPlayerParticipation}
              readOnlyKills={false}
              layout="block"
            />
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
            disabled={isSaving || !canSave()}
            className="bg-blue-600 dark:bg-blue-700 text-white hover:bg-blue-700 dark:hover:bg-blue-800 text-sm px-3 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}