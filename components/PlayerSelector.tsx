import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Player, TournamentConfig } from "@/lib/types";
import { toast } from "sonner";

interface PlayerSelectorProps {
  selectedTournament?: string | null;
  setTournamentTitle: (title: string | null) => void;
  selectedNoobs: string[];
  setSelectedNoobs: (ids: string[]) => void;
  selectedPros: string[];
  setSelectedPros: (ids: string[]) => void;
}

export default function PlayerSelector({
  selectedTournament,
  setTournamentTitle,
  selectedNoobs,
  setSelectedNoobs,
  selectedPros,
  setSelectedPros,
}: PlayerSelectorProps) {
  const [players, setPlayers] = useState<{ noobs: Player[]; pros: Player[] }>({
    noobs: [],
    pros: [],
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"noobs" | "pros">("noobs");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const playersCollection = collection(db, "players");
        const playersSnapshot = await getDocs(playersCollection);
        const noobs: Player[] = [];
        const pros: Player[] = [];

        playersSnapshot.forEach((doc) => {
          const playerData = { id: doc.id, ...doc.data() } as Player;
          if (playerData.deleted) return;
          if (playerData.category === "Noob") noobs.push(playerData);
          else if (playerData.category === "Pro") pros.push(playerData);
        });

        setPlayers({ noobs, pros });

        if (selectedTournament) {
          const tournamentDoc = doc(db, "tournaments", selectedTournament);
          const tournamentSnapshot = await getDoc(tournamentDoc);
          if (tournamentSnapshot.exists()) {
            const tournamentData = tournamentSnapshot.data() as TournamentConfig;
            setTournamentTitle(tournamentData.title);
          } else {
            setTournamentTitle(null);
          }
        } else {
          setTournamentTitle(null);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedTournament, setTournamentTitle]);

  const handleSelectAll = (category: "Noob" | "Pro") => {
    if (category === "Noob") {
      setSelectedNoobs(selectedNoobs.length === players.noobs.length 
        ? [] 
        : players.noobs.map((noob) => noob.id));
    } else {
      setSelectedPros(selectedPros.length === players.pros.length 
        ? [] 
        : players.pros.map((pro) => pro.id));
    }
  };

  const handleRowSelect = (playerId: string, category: "Noob" | "Pro") => {
    const setter = category === "Noob" ? setSelectedNoobs : setSelectedPros;
    const selected = category === "Noob" ? selectedNoobs : selectedPros;
    
    setter(selected.includes(playerId)
      ? selected.filter((id) => id !== playerId)
      : [...selected, playerId]);
  };

  const groupPlayers = (playerList: Player[]) => {
    const grouped: Player[][] = [];
    for (let i = 0; i < playerList.length; i += 5) {
      grouped.push(playerList.slice(i, i + 5));
    }
    return grouped;
  };

  const groupedNoobs = groupPlayers(players.noobs);
  const groupedPros = groupPlayers(players.pros);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="text-lg font-medium">Loading player data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <div className="w-40 space-y-2 border-r pr-4">
          <Button
            variant={activeTab === "noobs" ? "default" : "ghost"}
            className="w-full justify-start"
            onClick={() => setActiveTab("noobs")}
          >
            Noob Players
          </Button>
          <Button
            variant={activeTab === "pros" ? "default" : "ghost"}
            className="w-full justify-start"
            onClick={() => setActiveTab("pros")}
          >
            Pro Players
          </Button>
        </div>
        <div className="flex-1">
          <div className="flex justify-end mb-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSelectAll(activeTab === "noobs" ? "Noob" : "Pro")}
            >
              {activeTab === "noobs"
                ? selectedNoobs.length === players.noobs.length
                  ? "Deselect All"
                  : "Select All"
                : selectedPros.length === players.pros.length
                ? "Deselect All"
                : "Select All"}
            </Button>
          </div>
          <div className="max-h-[300px] overflow-y-auto space-y-4">
            {(activeTab === "noobs" ? groupedNoobs : groupedPros).map((group, index) => (
              <div key={index} className="flex gap-4">
                {group.map((player) => (
                  <Card
                    key={player.id}
                    className="flex-1 p-4 flex items-center gap-2"
                    onClick={() =>
                      handleRowSelect(player.id, activeTab === "noobs" ? "Noob" : "Pro")
                    }
                  >
                    <Checkbox
                      checked={
                        activeTab === "noobs"
                          ? selectedNoobs.includes(player.id)
                          : selectedPros.includes(player.id)
                      }
                      onCheckedChange={() =>
                        handleRowSelect(player.id, activeTab === "noobs" ? "Noob" : "Pro")
                      }
                    />
                    <span>{player.name}</span>
                  </Card>
                ))}
                {Array.from({ length: 5 - group.length }).map((_, i) => (
                  <Card key={`empty-${i}`} className="flex-1 p-4 opacity-0" />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}