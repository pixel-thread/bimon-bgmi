"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/src/components/ui/card";
import { Avatar } from "@/src/components/ui/avatar";
import { Input } from "@/src/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Search } from "lucide-react";
import { collection, getDocs, getDoc, doc } from "firebase/firestore";
import { db } from "@/src/lib/firebase";
import { Player, TournamentConfig } from "@/src/lib/types";
import { getBestTournamentForAutoSelect } from "@/src/lib/utils";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";
import { User as UserIcon } from "lucide-react";

function formatPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return "N/A";
  return phone.startsWith("+91") ? phone : `+91 ${phone}`;
}

interface SelectedPlayersTabProps {
  tournamentId?: string;
}

export function SelectedPlayersTab({ tournamentId }: SelectedPlayersTabProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTier, setSelectedTier] = useState<string>("All");
  const [latestTournamentId, setLatestTournamentId] = useState<
    string | undefined
  >(undefined);
  const [tournaments, setTournaments] = useState<TournamentConfig[]>([]);
  const [tournamentTitle, setTournamentTitle] = useState<string | null>(null);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Ultra Noob":
        return "bg-purple-100 text-purple-900 border-purple-200 dark:bg-purple-900 dark:text-purple-100 dark:border-purple-800";
      case "Noob":
        return "bg-green-100 text-green-900 border-green-200 dark:bg-green-900 dark:text-green-100 dark:border-green-800";
      case "Pro":
        return "bg-yellow-100 text-yellow-900 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-100 dark:border-yellow-800";
      case "Ultra Pro":
        return "bg-pink-100 text-pink-900 border-pink-200 dark:bg-pink-900 dark:text-pink-100 dark:border-pink-800";
      default:
        return "bg-gray-200 text-gray-800 border-gray-300";
    }
  };

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  useEffect(() => {
    const fetchTournamentsAndPlayers = async () => {
      setIsLoading(true);
      try {
        // Fetch all tournaments
        const tournamentsCollection = collection(db, "tournaments");
        const tournamentsSnapshot = await getDocs(tournamentsCollection);
        let tournamentsList: TournamentConfig[] = [];
        if (!tournamentsSnapshot.empty) {
          tournamentsList = tournamentsSnapshot.docs.map(
            (doc) => ({ id: doc.id, ...doc.data() } as TournamentConfig)
          );
          tournamentsList = tournamentsList.reverse(); // Latest tournament first
          setTournaments(tournamentsList);
        }

        // Use the new utility function to get the best tournament (preferring those with teams)
        let activeTournamentId: string | undefined;
        if (tournamentsList.length > 0) {
          try {
            const bestTournamentId = await getBestTournamentForAutoSelect(
              tournamentsList
            );
            activeTournamentId = bestTournamentId || tournamentsList[0].id;
          } catch (error) {
            console.error("Error selecting best tournament:", error);
            // Fallback to the first tournament
            activeTournamentId = tournamentsList[0].id;
          }
        }
        setLatestTournamentId(activeTournamentId);
        if (!activeTournamentId) {
          toast.error("No tournament found.");
          setIsLoading(false);
          return;
        }

        // Set tournament title
        const tournamentDoc = await getDoc(
          doc(db, "tournaments", activeTournamentId)
        );
        if (tournamentDoc.exists()) {
          setTournamentTitle(tournamentDoc.data().title);
        }

        // Get saved player selections
        const teamSelectionsDoc = await getDoc(
          doc(db, "teamSelections", activeTournamentId)
        );
        if (!teamSelectionsDoc.exists()) {
          toast.error("No player selections found for this tournament.");
          setPlayers([]);
          setIsLoading(false);
          return;
        }
        const savedPlayerIds = teamSelectionsDoc.data().savedPlayers || [];
        if (savedPlayerIds.length === 0) {
          toast.error("No players have been selected for this tournament.");
          setPlayers([]);
          setIsLoading(false);
          return;
        }
        // Fetch all players (exclude soft-deleted) and then filter by saved IDs
        const playersCollection = collection(db, "players");
        const playersSnapshot = await getDocs(playersCollection);
        const allPlayers: Player[] = [];
        playersSnapshot.forEach((doc) => {
          const playerData = { id: doc.id, ...doc.data() } as Player;
          if (!playerData.deleted && savedPlayerIds.includes(playerData.id)) {
            allPlayers.push(playerData);
          }
        });
        setPlayers(allPlayers);
      } catch (error) {
        console.error("Error fetching tournaments or players:", error);
        toast.error("Failed to load tournaments or players.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchTournamentsAndPlayers();
  }, []);

  const filterPlayers = (list: Player[]) =>
    list.filter(
      (p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.phoneNumber &&
          p.phoneNumber
            .replace(/\s+/g, "")
            .includes(searchQuery.replace(/\s+/g, "")))
    );

  // Filter players by category if a tier is selected
  let displayedPlayers = players;
  if (selectedTier !== "All") {
    displayedPlayers = players.filter(
      (player) => player.category === selectedTier
    );
  }

  // Apply search filter
  displayedPlayers = filterPlayers(displayedPlayers);

  // Sort players alphabetically by name
  displayedPlayers = displayedPlayers.sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <Card className="rounded-xl shadow border border-gray-200 dark:border-white/20 bg-background dark:bg-black text-foreground">
        <CardContent className="p-4">
          {/* Header */}
          <div className="pt-6 flex flex-col gap-2 mb-6">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-2xl font-bold text-foreground tracking-tight">
                Selected Players
              </h2>
              {tournamentTitle && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-900 border border-blue-200 dark:bg-blue-900 dark:text-blue-100 dark:border-blue-800">
                  {tournamentTitle}
                </span>
              )}
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-accent text-accent-foreground ml-2">
                {displayedPlayers.length}
              </span>
            </div>
            <div className="flex flex-wrap gap-2 mt-1">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-900 border border-purple-200 dark:bg-purple-900 dark:text-purple-100 dark:border-purple-800">
                Ultra Noob:{" "}
                {players.filter((p) => p.category === "Ultra Noob").length}
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-900 border border-green-200 dark:bg-green-900 dark:text-green-100 dark:border-green-800">
                Noob: {players.filter((p) => p.category === "Noob").length}
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-900 border border-yellow-200 dark:bg-yellow-900 dark:text-yellow-100 dark:border-yellow-800">
                Pro: {players.filter((p) => p.category === "Pro").length}
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-pink-100 text-pink-900 border border-pink-200 dark:bg-pink-900 dark:text-pink-100 dark:border-pink-800">
                Ultra Pro:{" "}
                {players.filter((p) => p.category === "Ultra Pro").length}
              </span>
            </div>
          </div>

          {/* Controls Row */}
          <div className="flex flex-col sm:flex-row flex-wrap gap-2 items-center justify-between mb-4 w-full">
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-500 dark:text-blue-400" />
                <Input
                  type="text"
                  placeholder="Search by name or phone number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-11 rounded-lg border border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900 text-blue-900 dark:text-blue-100 placeholder-blue-400 dark:placeholder-blue-500 focus:ring-2 focus:ring-blue-400 w-full pl-10 pr-4"
                  aria-label="Search players"
                />
              </div>
              <div className="flex flex-row gap-2 w-full sm:w-auto">
                <Select value={selectedTier} onValueChange={setSelectedTier}>
                  <SelectTrigger
                    id="category-filter"
                    className="h-11 rounded-lg border border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900 focus:ring-2 focus:ring-blue-400 min-w-fit w-auto px-3"
                  >
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent className="min-w-fit w-auto">
                    <SelectItem value="All">All Categories</SelectItem>
                    <SelectItem value="Ultra Noob">Ultra Noob</SelectItem>
                    <SelectItem value="Noob">Noob</SelectItem>
                    <SelectItem value="Pro">Pro</SelectItem>
                    <SelectItem value="Ultra Pro">Ultra Pro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Desktop Table */}
          <div className="hidden sm:block rounded-xl shadow border border-gray-200 dark:border-white/20 overflow-x-auto bg-background dark:bg-black text-foreground">
            <table className="w-full text-sm">
              <thead className="bg-accent text-accent-foreground">
                <tr>
                  <th className="p-3 text-left min-w-[120px]">Name</th>
                  <th className="p-3 text-left min-w-[140px]">Contact</th>
                  <th className="p-3 text-left min-w-[100px]">Category</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="p-4 text-center text-muted-foreground"
                    >
                      Loading...
                    </td>
                  </tr>
                ) : displayedPlayers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="p-4 text-center text-muted-foreground"
                    >
                      No players found
                    </td>
                  </tr>
                ) : (
                  displayedPlayers.map((player) => (
                    <tr
                      key={player.id}
                      className="border-t border-gray-200 dark:border-gray-800 hover:bg-muted/30"
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <Avatar
                            src={
                              (player as any).avatarBase64 ||
                              (player as any).avatarUrl
                            }
                            alt={player.name}
                            size="md"
                            className="w-9 h-9"
                          />
                          <span className="font-medium">{player.name}</span>
                        </div>
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {formatPhoneNumber(player.phoneNumber)}
                      </td>
                      <td className="p-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getCategoryColor(
                            player.category
                          )}`}
                        >
                          {player.category}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="sm:hidden space-y-3">
            {isLoading ? (
              <div className="p-4 text-center text-muted-foreground">
                Loading...
              </div>
            ) : displayedPlayers.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                No players found
              </div>
            ) : (
              displayedPlayers.map((player) => (
                <Card key={player.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={
                          (player as any).avatarBase64 ||
                          (player as any).avatarUrl
                        }
                        alt={player.name}
                        size="lg"
                        className="flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0 py-1">
                        <div className="flex flex-col">
                          <span className="font-semibold truncate">
                            {player.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatPhoneNumber(player.phoneNumber)}
                          </span>
                        </div>
                        <div className="mt-2">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getCategoryColor(
                              player.category
                            )}`}
                          >
                            {player.category}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
